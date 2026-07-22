import Link from "next/link";
import { ArrowRight, Inbox, Shield } from "lucide-react";
import { getViewer } from "@/lib/viewer";
import { souBibliotecario } from "@/lib/corrections";
import { souModerador } from "@/lib/moderacao";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════
 *  CUIDAR DO ACERVO. A fila de pedidos e a moderação, numa sala só.
 *
 *  Antes eram dois itens na barra lateral, ao lado de "Início" e "Estante" — e não
 *  são a mesma coisa. Início e Estante são LUGARES DE LER. Pedidos e moderação são
 *  um PAPEL: alguém faz isso além de ler, e não em vez de ler.
 *
 *  Misturar os dois na mesma barra pôs, na cara de todo mundo, botões que quase
 *  ninguém pode apertar — e fez o app parecer um painel de administração.
 *
 *  Esconder a porta não protege nada, e nunca protegeu: quem protege é lib/authz.ts
 *  e lib/moderacao.ts, no servidor, e cada uma destas telas checa o papel de novo por
 *  conta própria. Isto aqui é sobre ARRUMAÇÃO, e não sobre segurança.
 * ════════════════════════════════════════════════════════════════════
 */
export default async function Cuidar() {
  const viewer = await getViewer();

  // A checagem é REFEITA aqui, e não herdada da barra lateral. Um link escondido não
  // é uma permissão: qualquer pessoa digita /cuidar no navegador.
  const [bibliotecario, moderador] = await Promise.all([
    souBibliotecario(viewer),
    souModerador(viewer),
  ]);

  if (!bibliotecario && !moderador) {
    return (
      <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
        <ScreenHeader title="Cuidar do acervo" />
        <Empty>Esta sala não é para você. Nada de errado aconteceu.</Empty>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title="Cuidar do acervo"
        meta={[bibliotecario ? "bibliotecária" : null, moderador ? "moderação" : null].filter(
          (x): x is string => Boolean(x),
        )}
      />

      <p className="voice mt-6 max-w-prose text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
        O acervo do Gume é escolhido a mão, e cuidar dele é um trabalho de gente. Aqui
        estão as duas coisas que só quem tem esse papel pode fazer.
      </p>

      <div className="mt-10 flex flex-col gap-3">
        {/* A fila de quem procurou um livro e não achou. Sem ela, "escolhido a mão"
            vira um nome bonito para "faltando". Ver lib/torneira.ts. */}
        {bibliotecario && (
          <Sala
            href="/pedidos"
            titulo="Pedidos"
            texto="Os livros que alguém procurou aqui e não encontrou. É a lista do que trazer em seguida."
            Icon={Inbox}
          />
        )}

        {moderador && (
          <Sala
            href="/moderacao"
            titulo="Moderação"
            texto="O que foi denunciado, e o que já foi decidido. Toda decisão fica registrada com o nome de quem a tomou."
            Icon={Shield}
          />
        )}
      </div>
    </main>
  );
}

function Sala({
  href,
  titulo,
  texto,
  Icon,
}: {
  href: string;
  titulo: string;
  texto: string;
  Icon: typeof Inbox;
}) {
  return (
    <Link
      href={href}
      className="surface group flex items-start gap-4 p-6 transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_4%,transparent)]"
    >
      <Icon size={20} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[var(--color-ink-faint)]" />

      <div className="min-w-0 flex-1">
        <h2 className="text-[16px] text-[var(--color-ink)]">{titulo}</h2>
        <p className="mt-1.5 max-w-prose text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
          {texto}
        </p>
      </div>

      {/* A seta diz que dá para entrar. Sem ela, um cartão é um resumo. */}
      <ArrowRight
        size={18}
        strokeWidth={1.5}
        aria-hidden
        className="mt-1 shrink-0 text-[var(--color-ink-faint)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--color-ink)]"
      />
    </Link>
  );
}
