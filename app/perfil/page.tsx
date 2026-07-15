import Link from "next/link";
import { Download } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/viewer";
import { getInviter, isHerald, inviteLink } from "@/lib/invite";
import { InviteLink } from "@/components/invite-link";
import { CodigoPorEmail } from "@/components/codigo-email";
import { ProfileForm } from "@/components/profile-form";
import { HeraldSeal } from "@/components/herald-seal";

export const dynamic = "force-dynamic";

/**
 * Perfil. Who you are, what is on your shelf, and the promise that it is yours.
 * No follower count, no streak, no badge: those are refusals, not missing work.
 */
export default async function Perfil() {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
        <h1 className="voice mt-12 text-3xl leading-tight">Perfil</h1>
        <p className="mt-4 text-[15px] text-[var(--color-ink-soft)]">
          <Link href="/entrar" className="underline decoration-[var(--color-ink)] underline-offset-4">
            Entre
          </Link>{" "}
          para ver o seu.
        </p>
      </main>
    );
  }

  const [me] = await db.execute<{
    handle: string;
    display_name: string | null;
    bio: string | null;
    image: string | null;
    email: string;
    two_factor_enabled: boolean;
    livros: number;
    lidos: number;
    tem: number;
    autores: number;
  }>(sql`
    select u.handle, u.display_name, u.bio, u.image, u.email, u."twoFactorEnabled" as two_factor_enabled,
           (select count(*) from library_entries le where le.user_id = u.id)::int as livros,
           (select count(*) from library_entries le
             where le.user_id = u.id and le.status = 'read')::int as lidos,
           (select count(*) from owned_copies oc
             where oc.user_id = u.id and oc.state = 'owned')::int as tem,
           (select count(distinct w.author_id) from library_entries le
             join works w on w.id = le.work_id
             where le.user_id = u.id and w.author_id is not null)::int as autores
    from users u where u.id = ${viewer.id}::uuid
  `);

  if (!me) return <main className="px-6 pt-16">Leitor não encontrado.</main>;

  const [inviter, herald] = await Promise.all([
    getInviter(viewer.id),
    isHerald(viewer.id),
  ]);
  const appUrl = process.env.APP_URL ?? "";

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <h1 className="voice mt-16 text-[44px] leading-[1.02] tracking-[-0.015em] sm:mt-20 sm:text-[56px]">
        {me.display_name ?? me.handle}
      </h1>
      <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        @{me.handle}
      </p>

      {herald && <div className="mt-6"><HeraldSeal /></div>}

      <section className="surface mt-6 p-6">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          quem é você
        </h2>
        <ProfileForm
          displayName={me.display_name ?? ""}
          handle={me.handle}
          bio={me.bio ?? ""}
          image={me.image}
        />
      </section>

      {/* ═══ O CANAL DE CONTATO SAIU DAQUI ═══

          Ele existia por UM motivo: quando você deixava um livro para doar, trocar ou
          emprestar, quem te seguia de volta precisava falar com você para combinar.

          Doar, trocar e emprestar saíram do app (migration 0046). E um campo de contato
          guardado sem motivo não protege ninguém: é um telefone e um Instagram parados
          num banco de dados, esperando um vazamento.

          Guardar dado pessoal que não serve para nada é o oposto de cuidado. */}

      {/* ═══ O CÓDIGO POR E-MAIL ═══
          E ele NÃO se chama "dois fatores": código por e-mail não é um segundo fator se o
          reset de senha também vai por e-mail — é o mesmo fator, duas vezes. Ele protege
          contra senha vazada, e não contra e-mail invadido. Ver ai/DECISIONS.md. */}
      <CodigoPorEmail ativo={Boolean(me.two_factor_enabled)} email={me.email} />

      <dl className="surface mt-6 flex flex-wrap gap-x-12 gap-y-8 p-6">
        <Stat n={me.livros} label="na estante" />
        <Stat n={me.lidos} label="lidos" />
        <Stat n={me.tem} label="tem em casa" />
        <Stat n={me.autores} label={me.autores === 1 ? "autor" : "autores"} />
      </dl>

      {/* The door. Everyone has a link, it never runs out, there is no waiting
          list, and there is NO COUNTER of who you brought. A number next to a
          person turns hospitality into a scoreboard. See ai/DECISIONS.md. */}
      <section className="surface mt-6 p-6">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          convidar
        </h2>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Quem entrar por este link chega dentro de uma conversa: a primeira coisa que a pessoa
          vê é a sua estante, e não uma tela vazia.
        </p>
        <InviteLink url={inviteLink(me.handle, appUrl)} />

      </section>

      {inviter && (
        <section className="mt-14">
          <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            quem te trouxe
          </h2>
          <p className="voice mt-3 text-[17px]">
            <Link
              href={`/@${inviter.handle}`}
              className="underline decoration-[var(--color-rule)] underline-offset-4 hover:decoration-[var(--color-ink)]"
            >
              {inviter.displayName ?? inviter.handle}
            </Link>
          </p>
        </section>
      )}

      {/**
       * ════════════════════════════════════════════════════════════════
       *  A PORTA DE SAÍDA. Ela dizia "em breve", e "em breve" era a mentira.
       *
       *  O README promete a exportação na PRIMEIRA DOBRA, antes de qualquer funcionalidade,
       *  e fecha o argumento inteiro de confiança nela: "a saída é o ponto — é ela que torna
       *  as promessas reais, em vez de só bonitas".
       *
       *  Um app que promete a saída na capa e escreve "em breve" na tela está pedindo uma
       *  confiança que ele não devolve.
       *
       *  ═══ UM LINK, E NÃO UM PEDIDO ═══
       *
       *  Sem fila, sem e-mail, sem "estamos preparando o seu arquivo, avisaremos em breve".
       *  Isso é atrito disfarçado de cuidado, e é como as plataformas dificultam a saída sem
       *  parecer que dificultam. O arquivo começa a descer no clique.
       * ════════════════════════════════════════════════════════════════
       */}
      <section className="surface mt-6 p-6">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          seus dados
        </h2>

        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          Seus livros são seus, e dá para levá-los embora quando quiser: a estante, as datas
          de leitura, as notas e as resenhas, inclusive as privadas.
        </p>

        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-faint)]">
          O arquivo sai no formato que o Skoob, o StoryGraph e o Oku sabem importar. Uma saída
          que outro app não consegue ler não é uma saída.
        </p>

        <a
          href="/api/exportar"
          download
          className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-canvas)]"
        >
          <Download size={16} strokeWidth={1.5} aria-hidden />
          Baixar a minha estante
        </a>

        <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
          E se um dia você quiser ir embora, apagar a conta apaga mesmo: tudo que você escreveu
          some junto, na hora, sem deixar rastro para os outros.{" "}
          <strong className="font-medium text-[var(--color-ink)]">
            Baixe a sua estante antes
          </strong>
          , porque depois não tem de onde tirar.
        </p>
      </section>
    </main>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <dt className="voice tabular text-4xl leading-none">{n}</dt>
      <dd className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {label}
      </dd>
    </div>
  );
}
