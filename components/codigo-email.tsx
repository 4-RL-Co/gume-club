"use client";

import { useState } from "react";
import { twoFactor } from "@/lib/auth-client";
import { mandarCodigo } from "@/app/entrar/codigo/actions";

/**
 * ════════════════════════════════════════════════════════════════════
 *  CÓDIGO POR E-MAIL. E ele NÃO se chama "verificação em duas etapas".
 *
 *  ═══ O NOME É UMA PROMESSA, E ESTA PROMESSA SERIA FALSA ═══
 *
 *  **Código por e-mail não é um segundo fator se o reset de senha também vai por
 *  e-mail: é o mesmo fator, duas vezes.**
 *
 *  Ele protege contra senha vazada e reusada — que é o ataque real num app deste
 *  tamanho — e não protege contra invasão do e-mail. Chamar de "2FA" ou de "duas
 *  etapas" seria prometer uma segurança que não existe.
 *
 *  A tela diz o que ele é, e o que ele não é. Ver ai/DECISIONS.md.
 *
 *  ═══ POR QUE NÃO UM APP AUTENTICADOR ═══
 *
 *  Porque é um degrau que quase ninguém sobe: instalar um aplicativo, escanear um QR
 *  code, entender o que é um "segredo TOTP" — tudo isso ANTES de ganhar qualquer
 *  proteção.
 *
 *  **Um 2FA que a pessoa não liga não protege ninguém.** O Gume é um app de leitura, e
 *  não um banco: o público dele não vai instalar o Authy para guardar uma estante.
 *
 *  O código no e-mail é mais fraco que o TOTP, e isto está escrito na tela, na cara. Mas
 *  ele é um segundo fator de verdade para quem entra com senha — e ele é ligado com dois
 *  cliques, o que quer dizer que ele vai ser ligado.
 *
 *  ═══ OS DEZ CÓDIGOS DE RECUPERAÇÃO SÃO OBRIGATÓRIOS ═══
 *
 *  Alguém diria que com o e-mail eles perdem o sentido. Não perdem: **quem perde o acesso
 *  ao e-mail perde tudo** — não recebe o código, não recupera a senha, e não tem a quem
 *  recorrer, porque o suporte do Gume é uma pessoa só, num domingo.
 *
 *  Os dez códigos são a única porta que sobra. Então a tela não deixa ligar sem passar
 *  por eles: aparecem UMA VEZ, e a pessoa confirma, com a mão dela, que guardou.
 * ════════════════════════════════════════════════════════════════════
 */

type Passo =
  | { onde: "desligado" }
  | { onde: "senha" }
  | { onde: "guarde"; codigos: string[] }
  | { onde: "confirme" }
  | { onde: "ligado" };

export function CodigoPorEmail({ ativo, email }: { ativo: boolean; email: string }) {
  const [passo, setPasso] = useState<Passo>(ativo ? { onde: "ligado" } : { onde: "desligado" });
  const [senha, setSenha] = useState("");
  const [codigo, setCodigo] = useState("");
  const [guardei, setGuardei] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  /**
   * A SENHA é pedida de novo, e não é chatice.
   *
   * Ligar (ou desligar) o segundo fator é a mudança mais grave que alguém faz na própria
   * conta. Se um navegador ficar aberto num café, o que impede um estranho de desligar o
   * 2FA e sair andando é exatamente esta senha.
   */
  async function comecar() {
    setOcupado(true);
    setErro(null);

    const { data, error } = await twoFactor.enable({ password: senha });

    setSenha("");

    if (error || !data) {
      setOcupado(false);
      setErro(error?.message ?? "A senha não confere.");
      return;
    }

    setOcupado(false);
    setPasso({ onde: "guarde", codigos: data.backupCodes });
  }

  /**
   * Manda o código, e DIZ A VERDADE sobre o envio.
   *
   * A ação de servidor sabe se o e-mail saiu mesmo — a biblioteca não sabe, e responde
   * "enviado" mesmo quando falha. Ver app/entrar/codigo/actions.ts.
   */
  async function pedirCodigo() {
    setOcupado(true);
    setErro(null);

    const { ok, erro } = await mandarCodigo();

    setOcupado(false);

    if (!ok) {
      setErro(erro);
      return;
    }

    setPasso({ onde: "confirme" });
  }

  async function confirmar() {
    setOcupado(true);
    setErro(null);

    const { error } = await twoFactor.verifyOtp({ code: codigo.trim() });

    setOcupado(false);
    setCodigo("");

    if (error) {
      setErro("Esse código não confere, ou já passou dos dez minutos.");
      return;
    }

    setPasso({ onde: "ligado" });
  }

  async function desligar() {
    setOcupado(true);
    setErro(null);

    const { error } = await twoFactor.disable({ password: senha });

    setOcupado(false);
    setSenha("");

    if (error) {
      setErro(error.message ?? "A senha não confere.");
      return;
    }

    setPasso({ onde: "desligado" });
  }

  return (
    <section className="surface mt-6 p-6">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        código por e-mail
      </h2>

      {passo.onde === "desligado" && (
        <>
          <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
            Toda vez que você entrar com a senha, o Gume manda um código de seis dígitos
            para <span className="text-[var(--color-ink)]">{email}</span>. Quem descobrir a
            sua senha ainda vai precisar da sua caixa de entrada.
          </p>

          {/* ═══ A TELA DIZ O QUE ISTO NÃO PROTEGE ═══

              Um app que esconde o próprio limite de segurança é um app que mente sobre
              segurança. E o limite aqui é grande: quem invade o e-mail entra do mesmo
              jeito — porque o "esqueci a senha" também vai por e-mail. */}
          <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
            Isto protege contra <span className="text-[var(--color-ink-soft)]">senha
            vazada</span>, que é o que costuma acontecer. Não protege contra o seu e-mail
            invadido: quem entra na sua caixa também consegue trocar a sua senha. E se você
            entra pelo Google, muda pouco: o código chega no mesmo e-mail que acabou de te
            identificar.
          </p>

          <button
            onClick={() => setPasso({ onde: "senha" })}
            className="mt-5 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2 text-[13px] text-[var(--color-ink)] hover:border-[var(--color-ink)]"
          >
            Ligar
          </button>
        </>
      )}

      {passo.onde === "senha" && (
        <>
          <p className="mt-4 text-[14px] text-[var(--color-ink-soft)]">
            Digite a sua senha para continuar.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)]"
            />

            <button
              onClick={comecar}
              disabled={ocupado || senha.length === 0}
              className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
            >
              {ocupado ? "Um momento" : "Continuar"}
            </button>
          </div>
        </>
      )}

      {/* ═══ OS DEZ CÓDIGOS. UMA VEZ, E SÓ. ═══ */}
      {passo.onde === "guarde" && (
        <>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink)]">
            Guarde estes dez códigos agora. Cada um serve uma vez.
          </p>

          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
            Eles são a única forma de entrar se você perder o acesso ao seu e-mail. Não vão
            aparecer de novo, não dá para pedir outra cópia, e não existe ninguém a quem
            recorrer: o Gume não guarda uma via deles.
          </p>

          <ul className="tabular mt-5 grid max-w-md grid-cols-2 gap-x-6 gap-y-1.5">
            {passo.codigos.map((c) => (
              <li key={c} className="text-[14px] text-[var(--color-ink)]">
                {c}
              </li>
            ))}
          </ul>

          <button
            onClick={() =>
              navigator.clipboard?.writeText(passo.codigos.join("\n")).catch(() => {})
            }
            className="mt-4 text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            Copiar os dez
          </button>

          <label className="mt-6 flex max-w-lg cursor-pointer items-start gap-3 text-[14px] text-[var(--color-ink-soft)]">
            <input
              type="checkbox"
              checked={guardei}
              onChange={(e) => setGuardei(e.target.checked)}
              className="mt-1"
            />
            <span>
              Guardei os dez códigos num lugar seguro, e entendi que eles não aparecem de
              novo.
            </span>
          </label>

          <button
            onClick={pedirCodigo}
            disabled={!guardei || ocupado}
            className="mt-5 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
          >
            {ocupado ? "Enviando" : "Guardei. Mandar o código de teste"}
          </button>
        </>
      )}

      {/* ═══ E O 2FA SÓ LIGA DEPOIS DE FUNCIONAR UMA VEZ ═══ */}
      {passo.onde === "confirme" && (
        <>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink)]">
            Mandamos um código para <span className="font-medium">{email}</span>. Digite os
            seis dígitos para ligar a verificação.
          </p>

          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
            Ele vale por dez minutos, e só serve uma vez. Se não chegou, olhe no spam.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && codigo.length === 6 && confirmar()}
              className="tabular w-32 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[16px] tracking-[0.2em] outline-none focus:border-[var(--color-ink)]"
            />

            <button
              onClick={confirmar}
              disabled={ocupado || codigo.length !== 6}
              className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
            >
              {ocupado ? "Conferindo" : "Ligar a verificação"}
            </button>

            <button
              onClick={pedirCodigo}
              disabled={ocupado}
              className="text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-40"
            >
              mandar de novo
            </button>
          </div>
        </>
      )}

      {passo.onde === "ligado" && (
        <>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink)]">
            Está ligado. Toda vez que você entrar com a senha, o Gume manda um código para{" "}
            <span className="font-medium">{email}</span>.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <input
              type="password"
              autoComplete="current-password"
              placeholder="sua senha, para desligar"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)]"
            />

            {/* Desligar o segundo fator é destrutivo: é a cor do perigo, e não a da marca.
                Ver lib/cor.test.ts. */}
            <button
              onClick={desligar}
              disabled={ocupado || senha.length === 0}
              className="rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2 text-[13px] font-medium text-[var(--color-perigo)] disabled:opacity-40"
            >
              Desligar
            </button>
          </div>
        </>
      )}

      {erro && <p className="mt-3 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
    </section>
  );
}
