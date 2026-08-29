"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signUp } from "@/lib/auth-client";
import { rememberInviter } from "@/app/entrar/invite";
import { registrarEvento, origemAtual } from "@/lib/funil-client";

/**
 * Entrar. E-mail e senha, ou Google. Nada mais.
 *
 * Nenhum segredo mora aqui: a senha vai para o servidor, o hash é do Better
 * Auth, e a sessão volta num cookie httpOnly que este código não consegue ler.
 */
export default function Entrar() {
  const router = useRouter();
  const params = useSearchParams();
  // /entrar?novo=1: a home manda pra cá quem clicou em "Criar conta". Sem
  // isto, todo mundo caía num formulário de LOGIN por padrão, e é a
  // hipótese mais provável para 1.217 visitas virarem 2 cadastros.
  const [mode, setMode] = useState<"entrar" | "criar">(
    params.get("novo") === "1" ? "criar" : "entrar",
  );

  // /entrar?convite=<handle>. Stored server-side in a short cookie so it survives
  // the trip to Google and back, and read once when the account is created. A
  // porta saúda quem foi chamado: `rememberInviter` devolve o nome de quem
  // convidou, ou null se o convite for para alguém que não existe.
  const convite = params.get("convite");
  const [quemChamou, setQuemChamou] = useState<string | null>(null);

  /**
   * ═══ A VIAGEM PRO GOOGLE NÃO PODE SAIR ANTES DO COOKIE DO CONVITE ═══
   *
   * `rememberInviter` é uma chamada de rede — ela GRAVA o cookie, não é
   * instantânea. O botão do Google não esperava por ela: um clique rápido
   * (o caminho comum de quem chega de um link num post, no celular) saía
   * pro Google antes do `Set-Cookie` voltar, e o convite se perdia em
   * silêncio — sem erro, sem log, só um cadastro que parecia ter chegado
   * sozinho. Ver ai/DECISIONS.md.
   *
   * Este ref é a viagem em curso: os dois botões (Google e o formulário)
   * esperam por ele antes de continuar. Começa resolvido — sem `convite`
   * na URL não há nada para esperar.
   */
  const conviteEmVoo = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    if (!convite) return;
    let vivo = true;
    conviteEmVoo.current = rememberInviter(convite)
      .then((nome) => {
        if (vivo && nome) {
          setQuemChamou(nome);
          // Quem chega por um convite está criando conta, não entrando numa que já tem.
          setMode("criar");
        }
      })
      // A saudação é enfeite: se ela não chegar, a porta continua sendo uma porta.
      // O `catch` está aqui para o silêncio ser uma ESCOLHA, e não uma promessa
      // solta virando alarme de madrugada.
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [convite]);

  /**
   * `viu_entrar`, uma vez, no instante do primeiro render — ANTES de o efeito
   * do convite (acima) ter chance de terminar e trocar `mode`. É de propósito:
   * a pergunta desta fatia é "a porta abriu como cadastro ou como login", e a
   * resposta tem que ser a do momento em que a pessoa chegou, não a de depois
   * de qualquer ajuste automático.
   */
  useEffect(() => {
    registrarEvento("viu_entrar", { modoInicial: mode, origem: params.get("utm_source") ?? origemAtual() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  /**
   * ═══ O BOTÃO DO GOOGLE TEM ESTADO PRÓPRIO, E TEM POR UM MOTIVO ═══
   *
   * Ele é a única coisa desta tela que SAI do app antes de voltar, e o "e se não
   * sair" não tinha resposta: a chamada era um `onClick` solto, sem espera e sem
   * rede de proteção. Quando a viagem falhava (o alarme pegou uma, no navegador
   * de dentro de outro aplicativo, no iPhone), acontecia exatamente o que o
   * comentário do botão do GitHub aqui embaixo descreve: a pessoa clicava, nada
   * acontecia, e ela clicava de novo. O rastro do alarme mostra os dois cliques.
   *
   * Duas coisas nasceram daí, e são as duas metades do mesmo conserto:
   *
   *   "indo"    tranca o botão. O primeiro clique já mandou o navegador embora;
   *             o segundo só cancela o primeiro no meio do caminho.
   *   "falhou"  diz em voz alta o que antes só o console sabia, e devolve o
   *             botão para quem quiser tentar de novo.
   *
   * Sucesso não passa por aqui: quando dá certo, quem troca a página é o próprio
   * Better Auth, e este componente deixa de existir junto com a página.
   */
  const [google, setGoogle] = useState<"parado" | "indo" | "falhou">("parado");

  const submit = (data: FormData) =>
    start(async () => {
      setError(null);
      // Mesma espera do botão do Google, por simetria — aqui a corrida é bem
      // mais rara (digitar e-mail e senha já leva segundos), mas a regra é
      // uma só: ninguém cria conta antes do convite terminar de gravar.
      await conviteEmVoo.current;
      const email = String(data.get("email") ?? "").trim();
      const password = String(data.get("password") ?? "");
      const name = String(data.get("name") ?? "").trim();

      const res =
        mode === "criar"
          ? await signUp.email({ email, password, name: name || email.split("@")[0]! })
          : await signIn.email({ email, password });

      if (res.error) {
        // A mensagem é deliberadamente vaga: dizer "esse e-mail não existe"
        // entrega quem tem conta aqui para quem só está testando e-mails.
        setError(
          mode === "criar"
            ? "Não deu para criar a conta. A senha precisa de 12 caracteres ou mais."
            : "E-mail ou senha não conferem.",
        );
        return;
      }
      if (mode === "criar") {
        registrarEvento("cadastro_ok", { origem: params.get("utm_source") ?? origemAtual() });
      }
      // "tire a pagina de bem-vindo do gume (...) pode já redirecionar pra pasta
      // inicial mesmo" — o dono. Quem cria conta ou entra vai direto pra /,
      // igual todo mundo. A própria / já cobre a estante vazia (components de
      // estado vazio de app/page.tsx); "quem te convidou" continua em /perfil.
      router.push("/");
      router.refresh();
    });

  return (
    <main className="mx-auto max-w-sm px-6 pb-32">
      <h1 className="voice mt-16 text-3xl leading-tight">
        {mode === "entrar" ? "Entrar" : "Criar conta"}
      </h1>
      <p className="mt-2 text-[14px] text-[var(--color-ink-soft)]">
        Sua estante. Seus dados. Exportáveis a qualquer hora.
      </p>

      {/* Quem chega por um convite chega porque alguém chamou, e a recomendação de uma
          pessoa é o produto. Diz o nome, e para por aí: sem contagem regressiva, sem
          "seu amigo está esperando", sem pressão nenhuma. */}
      {quemChamou && (
        <p className="mt-6 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-3 text-[15px] leading-relaxed text-[var(--color-ink)]">
          <span className="font-medium">{quemChamou}</span> te chamou pro Gume.
        </p>
      )}

      <form action={submit} className="mt-8 flex flex-col gap-3">
        {mode === "criar" && (
          <Field name="name" label="nome" autoComplete="name" />
        )}
        <Field name="email" label="e-mail" type="email" required autoComplete="email" />
        <Field
          name="password"
          label="senha"
          type="password"
          required
          minLength={12}
          autoComplete={mode === "criar" ? "new-password" : "current-password"}
        />
        {mode === "criar" && (
          <p className="text-[12px] text-[var(--color-ink-faint)]">Doze caracteres ou mais.</p>
        )}

        {error && <p className="text-[13px] text-[var(--color-perigo)]">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pending ? "Um momento" : mode === "entrar" ? "Entrar" : "Criar conta"}
        </button>

        {mode === "entrar" && (
          <Link
            href="/entrar/esqueci"
            className="mt-1 text-center text-[12px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
          >
            esqueci a senha
          </Link>
        )}
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--color-rule)]" />
        <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">ou</span>
        <span className="h-px flex-1 bg-[var(--color-rule)]" />
      </div>

      {/* ═══ O BOTÃO DO GITHUB SAIU DAQUI ═══

          Ele estava na tela e NÃO ABRIA: o log dizia, a cada carga, "Social provider
          github is missing clientId or clientSecret". A pessoa clicava, nada acontecia, e
          ela concluía que o app estava quebrado antes de ter uma conta.

          Uma porta que aparece e não funciona é pior do que porta nenhuma.

          E "entrar com GitHub" num app de LEITURA confunde leitor: o público do Gume não
          sabe o que é GitHub, e não deveria precisar saber. O GitHub volta um dia, e como
          VÍNCULO de conta (a insígnia de Construtor precisa do handle), e não como porta
          de entrada. Ver lib/auth.ts e ai/DECISIONS.md. */}
      <button
        disabled={google === "indo"}
        onClick={async () => {
          setGoogle("indo");
          setError(null);
          /**
           * cadastro_ok, APROXIMADO. O mesmo botão serve pra entrar e criar
           * conta, e não dá pra saber daqui se este clique vai criar uma
           * conta nova ou só logar numa que já existe — essa certeza só
           * mora dentro do Better Auth (lib/auth.ts), e esta fatia decidiu
           * não tocar lá (decisão do dono). Dispara no CLIQUE, e não no
           * sucesso: quem sai pro Google não volta por aqui para avisar.
           */
          if (mode === "criar") {
            registrarEvento("cadastro_ok", { origem: params.get("utm_source") ?? origemAtual() });
          }
          try {
            // Espera o cookie do convite terminar de gravar antes de sair pro
            // Google. Some no `pending`: na prática resolve bem antes de a
            // pessoa notar "Um momento" na tela.
            await conviteEmVoo.current;
            const res = await signIn.social({ provider: "google", callbackURL: "/" });
            // Se a resposta voltou com erro, a viagem nem começou: o navegador
            // continua aqui, e o botão precisa voltar a funcionar.
            if (res?.error) setGoogle("falhou");
          } catch {
            // A rede caiu no meio, ou o navegador cancelou a chamada. Sem este
            // `catch`, a promessa morria sozinha e virava alarme sem dono.
            setGoogle("falhou");
          }
        }}
        className="flex w-full items-center justify-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2.5 text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)] disabled:opacity-40"
      >
        {/* A marca do Google, nas cores dela. É a ÚNICA marca de terceiro que o app
            desenha, e ela tem que ser reconhecível: um "G" cinza não é o Google, e um
            botão de login que a pessoa não reconhece é um botão que ela não aperta. */}
        <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden>
          <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.3z" />
          <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.5c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.2 15.4 46 24 46z" />
          <path fill="#FBBC05" d="M11.8 28.3c-.4-1.3-.7-2.7-.7-4.3s.3-3 .7-4.3v-5.7H4.5C2.9 17.1 2 20.4 2 24s.9 6.9 2.5 10l7.3-5.7z" />
          <path fill="#EA4335" d="M24 10.7c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.1 29.9 2 24 2 15.4 2 8.1 6.8 4.5 14l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
        </svg>
        {google === "indo"
          ? "Um momento"
          : mode === "criar"
            ? "Criar conta com o Google"
            : "Entrar com o Google"}
      </button>

      {google === "falhou" && (
        <p className="mt-2 text-[13px] text-[var(--color-perigo)]">
          Não deu para chamar o Google agora. Tente de novo, ou entre com e-mail e senha.
        </p>
      )}

      <button
        onClick={() => {
          setMode(mode === "entrar" ? "criar" : "entrar");
          setError(null);
        }}
        className="mt-8 text-[14px] font-medium text-[var(--color-ink)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink-soft)]"
      >
        {mode === "entrar" ? "Não tenho conta ainda." : "Já tenho conta."}
      </button>
    </main>
  );
}

function Field({
  name, label, ...rest
}: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {label}
      </span>
      <input
        name={name}
        {...rest}
        className="mt-1 w-full rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2.5 text-[15px] outline-none focus:border-[var(--color-ink)]"
      />
    </label>
  );
}
