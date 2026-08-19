import { Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getViewer } from "@/lib/viewer";
import { getProfile, isFollowing } from "@/lib/social";
import { getShelf, getShelfCounts } from "@/lib/shelf";
import { getFavoritos } from "@/lib/favoritos";
import { getDiario } from "@/lib/diario";
import { LinksDoPerfil } from "@/components/links-do-perfil";
import { getResumoDoPerfil } from "@/lib/stats";
import { ResumoDoPerfil } from "@/components/resumo-do-perfil";
import { getFriendRatings } from "@/lib/ratings";
import { ConfirmeSeuEmail } from "@/components/confirme-seu-email";
import { estaInvisivel, contarLivrosQueProvam, LIVROS_QUE_PROVAM } from "@/lib/descoberta";
import { Share } from "@/components/share";
import { Report } from "@/components/report";
import { Moldura, Barra } from "@/components/moldura";
import { getEscadas } from "@/lib/escada";
import { FollowButton } from "@/components/follow-button";
import { chegadaDe, getBadges } from "@/lib/badges";
import { BadgesExplicadas } from "@/components/badges";
import { getListasDe, getListasGuardadas } from "@/lib/listas";
import { getCuradoriasGuardadas } from "@/lib/curadoria-guardada";
import { souIdealizador } from "@/lib/authz";
import { getResenhasDe } from "@/lib/explore";
import { PerfilAbas } from "@/components/perfil-abas";
import { CuradoriaCard } from "@/components/curadoria-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

/* A TIRA DE "LENDO AGORA" SAIU DO PERFIL: a estante com recortes, no fim da página,
   já responde "o que ela está lendo" num clique, e duas moradas para a mesma resposta
   era o pergaminho voltando aos poucos. O presente de quem você segue continua tendo
   vitrine própria onde ele é assunto: a tira de amigos, em /pessoas. */

/**
 * The public profile: /@handle.
 *
 * Indexable and worth linking to, which is the point: a shelf nobody can see is a
 * spreadsheet. Every row still passes through visibleTo() in SQL, so a stranger
 * gets the public rows, a follower also gets the `followers` rows, and nobody
 * gets the private ones. The page never decides that; the query does.
 *
 * This is the catch-all dynamic route, so it sits below every real page: /buscar,
 * /ano and friends are static segments and win. Anything that does not start with
 * an @ is simply not a profile.
 */
function parse(raw: string): string | null {
  const handle = decodeURIComponent(raw);
  return handle.startsWith("@") ? handle.slice(1) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const handle = parse((await params).handle);
  if (!handle) return {};
  const profile = await getProfile(handle);
  if (!profile) return {};

  const name = profile.displayName ?? profile.handle;

  /**
   * ════════════════════════════════════════════════════════════════════
   *  SEM E-MAIL VERIFICADO, O PERFIL É `noindex`.
   *
   *  Cadastro aberto + /@handle indexável = FAZENDA DE SEO. Não é um risco
   *  teórico: é o que SEMPRE acontece, em todo produto que abriu o cadastro
   *  e deixou o perfil indexável. Mil contas, mil bios com link, e o Google
   *  indexando todas.
   *
   *  A verificação NÃO bloqueia nada do produto: quem não verificou usa o
   *  app inteiro, com a estante inteira. O que ele não tem é a página no
   *  Google — e uma página que o Google não vê não vale nada para um
   *  spammer.
   *
   *  O portão está na SAÍDA, e não na entrada: trancar a porta de entrada
   *  machuca a pessoa de verdade (que não achou o e-mail, que caiu no spam)
   *  e não machuca o script, que verifica e segue.
   * ════════════════════════════════════════════════════════════════════
   */
  return {
    title: `${name} · Gume`,
    description: `A estante de ${name}.`,
    robots: profile.emailVerified
      ? undefined
      : { index: false, follow: false, nocache: true },
  };
}

export default async function Profile({ params }: { params: Promise<{ handle: string }> }) {
  const handle = parse((await params).handle);
  if (!handle) notFound();

  const profile = await getProfile(handle);
  if (!profile) notFound();

  const viewer = await getViewer();
  const mine = viewer?.id === profile.id;

  const [books, counts, following, badges, shelves, guardadas, resenhas, curadorias, favoritos, resumo, diario] = await Promise.all([
    getShelf(viewer, profile.id, { filter: "tudo", sort: "adicionado" }),
    getShelfCounts(viewer, profile.id),
    viewer && !mine ? isFollowing(viewer.id, profile.id) : Promise.resolve(false),
    // Insígnias, e nunca um número: o número vive em /contribuidores e não sai de lá.
    getBadges(profile.id),
    // As estantes que ela montou, como CARDS: capas, nome, descrição. Ver lib/listas.ts.
    getListasDe(viewer, profile.id),
    // E as que ela GUARDOU de outras pessoas, com o crédito de quem fez. A visibilidade
    // roda de novo aqui: uma estante que ficou privada some desta seção sozinha.
    getListasGuardadas(viewer, profile.id),
    // As resenhas DELA, e a consulta é quem decide quais: privada nunca sai daqui.
    // Ver getResenhasDe() em lib/explore.ts e SECURITY.md.
    getResenhasDe(viewer, profile.id),
    // E a curadoria da casa que ela guardou. Ela não é uma lista (o Top 100 é
    // calculado a cada visita), então vem de outra tabela. Ver lib/curadoria-guardada.ts.
    getCuradoriasGuardadas(profile.id),
    // Até cinco, escolhidos à mão — substitui "o que eu adorei" (todo 5
    // estrelas, sem limite). Ver lib/favoritos.ts.
    getFavoritos(profile.id),
    getResumoDoPerfil(viewer, profile.id),
    // "é legal também ter uma linha do tempo tipo um diario de livros
    // terminados" — cada leitura, mais recente primeiro. Ver lib/diario.ts.
    getDiario(viewer, profile.id),
  ]);

  // A HONRA. Uma escada só: livros, HQs e cada volume de mangá contam juntos. Ver
  // lib/honras.ts.
  const escadas = await getEscadas(profile.id);

  // O perfil da CASA carrega a curadoria da casa fixada nas listas: as editoriais
  // moram com quem as edita. souIdealizador aqui não é permissão, é identificação:
  // pergunta se ESTE perfil é o de quem imaginou o Gume.
  const perfilDaCasa = await souIdealizador({ id: profile.id });

  const name = profile.displayName ?? profile.handle;
  const primeiroNome = name.split(" ")[0];

  /**
   * ═══ O SELO DE GUIA. Sem consulta nova, e fora do sistema de insígnias ═══
   *
   * `getListasDe` já traz `guardadas` por lista (ver lib/listas.ts e o teste em
   * lib/listas.sql.test.ts). "Guia" é quem montou pelo menos uma lista que ficou boa
   * o bastante para alguém guardar — reaproveita o mesmo dado, e não soma um select.
   *
   * NÃO é insígnia (não mora em lib/badges-view.ts): o círculo de cor das oito/nove
   * insígnias trava matematicamente 30° entre matizes e 30° do accent da marca, e as
   * oito já usam o círculo inteiro sem sobrar ângulo livre. Forçar uma nona cor exigia
   * afrouxar essa trava para todo mundo, e o dono preferiu um selo à parte a mexer
   * numa garantia que já evitou uma colisão de cor de verdade. Ver ai/DECISIONS.md.
   */
  const ehGuia = shelves.some((s) => s.guardadas > 0);
  const opinions = await getFriendRatings(viewer, books.map((b) => b.workId));

  /**
   * ═══ VOCÊ ESTÁ INVISÍVEL, E O APP TEM QUE CONTAR ═══
   *
   * Quem não confirmou o e-mail some do explorar, das listas, do "pessoas" e dos
   * buscadores — e nada na tela dizia isso. O único sintoma era ninguém nunca
   * seguir a pessoa, e ela não tinha como ligar uma coisa à outra.
   *
   * A conta é a MESMA de lib/descoberta.ts: uma estante pública de verdade também
   * abre a porta, então quem já está perto sabe quanto falta em vez de ouvir só
   * "confirme seu e-mail".
   */
  const livrosQueProvam = mine ? await contarLivrosQueProvam(profile.id) : 0;
  const invisivel = mine && estaInvisivel(profile.emailVerified, livrosQueProvam);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <div className="surface mt-16 flex items-start gap-6 p-7 sm:mt-24 sm:gap-8 sm:p-8">
        {/* A person is round. A book is a rectangle. The shape alone tells you
            which is which, and it is why a page carrying both can be skimmed. */}
        {/* A MOLDURA. O elo da pessoa, ou — se ela apoia e escolheu isso — a verde-água
            de apoiador. Um anel, e não um brasão: ver components/moldura.tsx. */}
        <span className="hidden sm:block">
          <Moldura
            coroa={escadas.coroa}
            src={profile.image}
            name={profile.displayName}
            handle={profile.handle}
            size={124}
          />
        </span>
        <span className="sm:hidden">
          <Moldura
            coroa={escadas.coroa}
            src={profile.image}
            name={profile.displayName}
            handle={profile.handle}
            size={80}
          />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="voice text-[40px] leading-[1.02] tracking-[-0.015em] sm:text-[56px]">
            {name}
          </h1>
          <p className="tabular mt-3 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {[`@${profile.handle}`, `${counts.tudo ?? 0} livros`, (counts.lidos ?? 0) > 0 && `${counts.lidos} lidos`]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {profile.bio && (
            <p className="voice mt-5 max-w-lg text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
              {profile.bio}
            </p>
          )}

          <LinksDoPerfil links={profile.socialLinks} />

          {/* As insígnias reconhecem DOAÇÃO À COMUNIDADE, nunca leitura. São um sim ou
              um não: você tem, ou não tem. Nenhuma delas diz quanto a pessoa leu,
              avaliou ou seguiu, e nenhuma carrega um número aqui — o número de
              contribuição vive em /contribuidores, e não viaja. Ver lib/badges.ts. */}
          {badges.length > 0 && (
            <div className="mt-6">
              <BadgesExplicadas badges={badges} chegada={chegadaDe(profile.id)} />
            </div>
          )}

          {/* ═══ A HONRA ═══

              Uma barra só. Livros, HQs e volumes de mangá contam juntos, e só aparece
              quando a pessoa leu alguma coisa: quem nunca terminou nada não precisa ver
              uma barra vazia todo dia dizendo que está devendo. */}
          <div className="mt-7 sm:max-w-xl">
            {escadas.posicao.quantas > 0 && <Barra p={escadas.posicao} />}
          </div>

          {/* Seguir e compartilhar moram juntos, e é de propósito: as duas são
              a mesma pergunta ("quero levar esta pessoa comigo"), e o app cresce
              porque um amigo mostra a estante para o outro. */}
          <div className="mt-6 flex flex-wrap items-center gap-5">
            {viewer && !mine && (
              <FollowButton userId={profile.id} following={following} handle={profile.handle} />
            )}

            {/* VER, e só então editar.
                Clicar no próprio nome levava DIRETO para o formulário, e ninguém
                quer editar o perfil: as pessoas querem VER o perfil. Ver o que os
                outros veem é o único jeito de saber se está bom, e o formulário
                aparecia antes de a pessoa ter olhado para o que ia mudar. */}
            {mine && (
              <Link
                href="/perfil"
                className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2 text-[13px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
              >
                <Pencil size={14} strokeWidth={1.5} />
                editar perfil
              </Link>
            )}

            <Share titulo={`A estante de ${profile.displayName ?? profile.handle}`} />

            {/* Discreto de propósito: um botão de denúncia grande é um convite para
                denunciar por discordar. Só para quem está logado, porque denúncia
                anônima é um formulário de spam com outro nome. */}
            {viewer && !mine && <Report handle={profile.handle} />}
          </div>
        </div>
      </div>

      {invisivel && <ConfirmeSeuEmail faltam={LIVROS_QUE_PROVAM - livrosQueProvam} />}

      <ResumoDoPerfil resumo={resumo} primeiroNome={primeiroNome ?? name} mine={mine} />

      {/* ═══ O RESTO DO PERFIL, EM ABAS ═══

          Sete seções empilhadas (coleção, adorei, resenhas, listas feitas, listas
          guardadas, estante) viravam um pergaminho — a mesma reclamação que já valia
          para /painel antes das abas. Mesmo padrão: um componente de cliente troca o
          que aparece, sem voltar ao servidor. A ordem das abas preserva a prioridade
          que a página já tinha: "o que é mais difícil de conseguir vem primeiro".
          Ver components/perfil-abas.tsx. */}
      <PerfilAbas
        mine={mine}
        primeiroNome={primeiroNome ?? name}
        podeVotar={Boolean(viewer)}
        books={books}
        opinions={opinions}
        favoritos={favoritos}
        resenhas={resenhas}
        diario={diario}
        shelves={shelves}
        guardadas={guardadas}
        curadorias={curadorias}
        curadoriaFixa={perfilDaCasa ? <CuradoriaCard compacto /> : null}
        ehGuia={ehGuia}
        contagemEstante={{ tudo: counts.tudo ?? 0, lidos: counts.lidos ?? 0 }}
      />
    </main>
  );
}
