"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { twoFactor } from "@/lib/auth-client";
import { mandarCodigo } from "./actions";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CÓDIGO POR E-MAIL, NA HORA DE ENTRAR.
 *
 *  ═══ ELE NÃO SE CHAMA "DOIS FATORES" ═══
 *
 *  Código por e-mail **não é um segundo fator** se o reset de senha também vai por
 *  e-mail: é o mesmo fator, duas vezes. Ele protege contra senha vazada e reusada, e não
 *  protege contra invasão do e-mail.
 *
 *  Chamar de "2FA" seria prometer uma segurança que não existe. Ver ai/DECISIONS.md.
 *
 *  ═══ A SESSÃO SÓ NASCE DEPOIS DO CÓDIGO ═══
 *
 *  Não existe meia-sessão, e não existe "entrou mas ainda não confirmou".
 *
 *  ═══ E A TELA NUNCA DIZ QUE MANDOU QUANDO NÃO MANDOU ═══
 *
 *  O e-mail está no CAMINHO CRÍTICO DO LOGIN: e-mail caído agora quer dizer que ninguém
 *  entra. Se o envio falhar, esta tela diz que falhou, com todas as letras — e diz que o
 *  problema é nosso.
 *
 *  A biblioteca não faz isso sozinha (ela responde "enviado" mesmo quando o e-mail não
 *  sai), e é por isso que o envio passa por uma ação nossa. Ver ./actions.ts.
 * ════════════════════════════════════════════════════════════════════
 */
export default function Codigo() {
  const router = useRouter();

  const [codigo, setCodigo] = useState("");
  const [recuperacao, setRecuperacao] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [espera, setEspera] = useState(0);

  /**
   * O código sai sozinho, UMA vez, ao abrir a tela.
   *
   * O `useRef` é o que impede o React de mandar DOIS e-mails: em desenvolvimento ele
   * monta o componente duas vezes de propósito, e sem esta trava a pessoa recebe dois
   * códigos — e o primeiro deixa de valer, que é a pior coisa possível.
   */
  const jaPediu = useRef(false);

  useEffect(() => {
    if (jaPediu.current) return;
    jaPediu.current = true;
    void pedir();
  }, []);

  /** O contador do reenvio. Um botão que se pode apertar dez vezes seguidas é um ataque. */
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function pedir() {
    setOcupado(true);
    setErro(null);

    const { ok, erro } = await mandarCodigo();

    setOcupado(false);

    // A VERDADE, e não um otimismo. "Enviado" só quando saiu de verdade.
    setEnviado(ok);
    setErro(erro);
    if (ok) setEspera(60);
  }

  async function entrar() {
    setOcupado(true);
    setErro(null);

    const limpo = codigo.trim();

    const { error } = recuperacao
      ? await twoFactor.verifyBackupCode({ code: limpo })
      : await twoFactor.verifyOtp({ code: limpo });

    setOcupado(false);

    if (error) {
      setErro(
        recuperacao
          ? "Esse código de recuperação não confere, ou já foi usado."
          : "Esse código não confere, já foi usado, ou passou dos dez minutos.",
      );
      setCodigo("");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
      <h1 className="voice text-[34px] leading-tight">Falta um passo.</h1>

      <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
        {recuperacao
          ? "Digite um dos dez códigos de recuperação que você guardou. Cada um serve uma vez."
          : enviado
            ? "Mandamos um código de seis dígitos para o seu e-mail. Ele vale por dez minutos, e só serve uma vez."
            : erro
              ? "O código não foi enviado."
              : "Mandando um código para o seu e-mail…"}
      </p>

      <input
        inputMode={recuperacao ? "text" : "numeric"}
        autoComplete="one-time-code"
        autoFocus
        placeholder={recuperacao ? "código de recuperação" : "000000"}
        value={codigo}
        onChange={(e) =>
          setCodigo(recuperacao ? e.target.value : e.target.value.replace(/\D/g, "").slice(0, 6))
        }
        onKeyDown={(e) => e.key === "Enter" && codigo.length > 0 && entrar()}
        className="tabular mt-6 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-4 py-3 text-[18px] tracking-[0.2em] outline-none focus:border-[var(--color-ink)]"
      />

      <button
        onClick={entrar}
        disabled={ocupado || codigo.length === 0}
        className="mt-4 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
      >
        {ocupado ? "Conferindo" : "Entrar"}
      </button>

      {erro && <p className="mt-3 text-[13px] text-[var(--color-perigo)]">{erro}</p>}

      {/* O REENVIO, COM CONTADOR.
          Um botão de reenviar que se pode apertar dez vezes seguidas é um ataque à caixa
          de entrada de quem quer que seja — e cada código novo mata o anterior, então
          apertar dez vezes é a melhor maneira de nunca conseguir entrar. */}
      {!recuperacao && (
        <button
          onClick={pedir}
          disabled={ocupado || espera > 0}
          className="mt-4 self-start text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)] disabled:no-underline disabled:opacity-60"
        >
          {espera > 0
            ? `Mandar de novo em ${espera}s`
            : erro
              ? "Tentar mandar de novo"
              : "Não chegou. Mandar de novo"}
        </button>
      )}

      {/* A SAÍDA FICA À VISTA. Quem perdeu o acesso ao e-mail está nervoso, e é ele quem
          mais precisa dela. Escondê-la atrás de um "problemas para entrar?" é a maneira
          mais fácil de fazer alguém achar que perdeu a conta. */}
      <button
        onClick={() => {
          setRecuperacao(!recuperacao);
          setCodigo("");
          setErro(null);
        }}
        className="mt-8 self-start text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        {recuperacao
          ? "Recebi o e-mail: usar o código de seis dígitos"
          : "Não consigo acessar meu e-mail: usar um código de recuperação"}
      </button>
    </main>
  );
}
