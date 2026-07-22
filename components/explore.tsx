import Link from "next/link";
import { getEstantes, getAfinidade, getResenhas, getLendoAgora } from "@/lib/explore";
import { getListasParaExplorar } from "@/lib/listas";
import { getQueridinhos } from "@/lib/queridinhos";
import { Crown } from "lucide-react";
import { ListaGrid } from "@/components/lista-card";
import { getCoroasPorHandle } from "@/lib/escada";
import { Moldura } from "@/components/moldura";
import { Empty } from "@/components/empty";
import { Cover } from "@/components/cover";
import { AfinidadeLinha } from "@/components/afinidade-linha";
import { BuscaPessoas } from "@/components/busca-pessoas";
import type { Viewer } from "@/lib/authz";

/**
 * EXPLORAR: uma livraria de PESSOAS, e uma das três abas de /pessoas.
 *
 * É como você ESCOLHE quem seguir. Nada aqui é ordenado por engajamento,
 * popularidade ou "em alta". Ver lib/explore.ts e ai/DECISIONS.md.
 *
 * ═══ E NÃO TEM FEED DE ESTRANHOS AQUI ═══
 *
 * Já teve. A "praça", um feed cronológico de quem você ainda não segue, viveu no fim
 * desta tela por um tempo, e saiu a pedido do dono. A razão: esta aba é para ESCOLHER
 * quem seguir, e um feed de estranhos pendurado embaixo puxava a tela de volta para o
 * ruído que ela existe para evitar. Um feed geral de "todo mundo terminou tal livro" é
 * ruído de estranho, e é onde nasce a vontade de performar.
 *
 * O que fica são as seções que ajudam a ESCOLHER: estantes para descobrir, quem lê o que
 * você lê (que abre e mostra quem são as pessoas), resenhas recentes, e o que está aberto
 * na mesa de alguém agora. Ver ai/DECISIONS.md, a entrada que tirou a praça.
 */
export async function Explore({ viewer }: { viewer: Viewer }) {
  const [estantes, listas, afinidade, resenhas, lendo, queridinhos] = await Promise.all([
    getEstantes(viewer),
    // As estantes MONTADAS, com nome e recorte. Sorteadas como tudo aqui: "as mais
    // guardadas" seria um ranking de popularidade, e é a coisa que esta tela recusa.
    getListasParaExplorar(viewer),
    getAfinidade(viewer),
    getResenhas(viewer),
    getLendoAgora(viewer),
    // O TOPO dos queridinhos, para o cartão da casa mostrar as capas de verdade.
    getQueridinhos(5),
  ]);

  /**
   * A MOLDURA DO ELO, em toda cara desta tela.
   *
   * Uma consulta só, para todo mundo que aparece aqui — e não uma por avatar. Ver
   * getCoroasDe() em lib/escada.ts.
   *
   * A moldura vem porque ela é a identidade da pessoa: se ela só existisse no perfil,
   * ninguém veria a de ninguém, e ela seria um enfeite que a pessoa põe para si mesma.
   */
  const coroas = await getCoroasPorHandle([
    ...new Set([
      ...estantes.map((e) => e.handle),
      ...resenhas.map((r) => r.handle),
      // "lendo agora" é uma lista de LIVROS, e não de gente. Ela não tem cara nenhuma.
    ]),
  ]);

  const vazio =
    estantes.length === 0 && listas.length === 0 && afinidade.length === 0 &&
    resenhas.length === 0 && lendo.length === 0;

  return (
    <div className="mt-8">
      {/* ── BUSCAR UMA PESSOA: fica no topo, e sempre, mesmo quando não há estante
          pública para descobrir. Achar quem você já conhece não depende de ter gente
          nova para conhecer. Ver components/busca-pessoas.tsx. */}
      {/* A busca de pessoas exige sessão (o servidor recusa anônimo): para quem não
          entrou, a galeria continua inteira, só sem o campo. */}
      {viewer && <BuscaPessoas />}

      {vazio ? (
        <div className="mt-10">
          <Empty>
            Ainda não tem estante pública para descobrir. Assim que alguém abrir a estante, ela
            aparece aqui. Mas você já pode buscar quem conhece pelo nome, ali em cima.
          </Empty>
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-10">
          {/* ── 1. ESTANTES PARA DESCOBRIR: o coração da tela ────────── */}
          <section>
            <Titulo>estantes para descobrir</Titulo>

            {/* A ORDEM É SORTEADA, e a tela diz isso. Ordenar por atividade premiaria quem
                cadastra livro toda semana, e a estante de quem lê devagar nunca apareceria.
                Dizer "sorteadas" também explica por que a lista muda a cada visita: sem
                isso, a pessoa acha que o app está bugado. Ver lib/explore.ts. */}
            {estantes.length > 0 && (
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                Sorteadas, e não ordenadas: a lista muda a cada visita, e quem lê devagar
                aparece tanto quanto quem lê rápido.
              </p>
            )}

            {/* Quem você já segue não aparece aqui, então esta seção esvazia quando
                você já seguiu todo mundo. Não é erro, e a tela diz isso em voz alta
                em vez de sumir e deixar a pessoa achando que quebrou. */}
            {estantes.length === 0 ? (
              <p className="surface mt-6 p-7 text-[15px] leading-relaxed text-[var(--color-ink-soft)]">
                Você já segue todo mundo que abriu a estante por aqui. Quando alguém novo chegar, a
                estante dela aparece nesta lista.
              </p>
            ) : (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5">
                {estantes.map((e) => (
                  <li key={e.handle}>
                    <Link href={`/@${e.handle}`} className="surface surface-hover flex h-full flex-col p-6 sm:p-7">
                      <span className="flex items-center gap-3">
                        <Moldura coroa={coroas[e.handle] ?? null} src={e.image} name={e.name} handle={e.handle} size={52} />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] text-[var(--color-ink)]">
                            {e.name ?? e.handle}
                          </span>
                          <span className="block truncate text-[12px] text-[var(--color-ink-faint)]">
                            @{e.handle}
                          </span>
                        </span>
                      </span>

                      {e.bio && (
                        <span className="voice mt-4 line-clamp-2 text-[16px] leading-snug text-[var(--color-ink-soft)]">
                          {e.bio}
                        </span>
                      )}

                      <span className="mt-6 flex gap-2">
                        {e.capas.slice(0, 6).map((c, i) => (
                          <span key={i} className="cover-lift block w-1/6">
                            <Cover title="" src={c} />
                          </span>
                        ))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── ESTANTES MONTADAS À MÃO: a curadoria de alguém, com nome e recorte.
              Sorteadas e rotacionando, como tudo nesta tela: destacar "as mais
              guardadas" seria um ranking de popularidade com outro chapéu. */}
          {listas.length > 0 && (
            <section>
              <Titulo>estantes montadas à mão</Titulo>
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                Coleções que alguém montou com as próprias mãos. Abra uma, e se ela for boa,
                guarde: ela fica no seu perfil, com o nome de quem fez.
              </p>
              <div className="mt-6">
                <ListaGrid listas={listas} />
              </div>
            </section>
          )}

          {/* ═══ A CURADORIA DO GUME, EM DESTAQUE ═══

              O cartão da casa: maior que os outros, com o pódio de verdade dentro (as
              cinco capas mais adoradas, a primeira no trono). É a lista da INSTITUIÇÃO,
              montada pela comunidade inteira, e merece parecer isso. Só aparece quando
              já existe queridinho: um cartão de vitrine vazio é uma promessa quebrada. */}
          {queridinhos.length > 0 && (
            <Link
              href="/queridinhos"
              className="surface surface-hover block overflow-hidden p-7 sm:p-9"
            >
              <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                <Crown size={13} strokeWidth={1.5} aria-hidden />
                a curadoria do Gume
              </span>
              <span className="voice mt-2 block text-[26px] leading-tight text-[var(--color-ink)] sm:text-[30px]">
                Os queridinhos do Gume
              </span>
              <span className="mt-2 block max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                Os cem livros que a comunidade mais adorou, na ordem do amor recebido.
                Ninguém edita: cada veredito conta, e a lista se refaz sozinha.
              </span>

              {/* O pódio em capas: o 1º maior e na frente, os outros descendo atrás,
                  como um expositor. As capas são a única cor, como sempre. */}
              <span className="mt-6 flex items-end gap-3">
                {queridinhos.map((q, i) => (
                  <span
                    key={q.slug}
                    className="cover-lift block shrink-0"
                    style={{ width: `${i === 0 ? 21 : 16 - i}%`, zIndex: 10 - i }}
                  >
                    <Cover title={q.title} author={q.author} src={q.coverUrl} />
                  </span>
                ))}
              </span>
            </Link>
          )}

          {/* ── 2. QUEM LÊ O QUE VOCÊ LÊ ─────────────────────────────── */}
          {afinidade.length > 0 && (
            <section className="surface p-7 sm:p-8">
              <Titulo>quem lê o que você lê</Titulo>
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                Os livros que estão na sua estante e na dela. Clique numa linha para ver quem
                são essas pessoas, e siga quem lê o que você lê.
              </p>

              {/* Cada linha abre um POPUP com quem tem o livro (components/afinidade-linha.tsx).
                  A lista rola dentro do popup, então cem leitores não esticam a página nem
                  soterram o botão do livro. É assim que a afinidade vira conexão. */}
              <ul className="mt-7 flex flex-col gap-4">
                {afinidade.map((a) => (
                  <li key={a.slug}>
                    <AfinidadeLinha
                      slug={a.slug}
                      title={a.title}
                      author={a.author}
                      coverUrl={a.coverUrl}
                      leitores={a.leitores}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── 3. RESENHAS RECENTES: só o que alguém sentou e escreveu ── */}
          {resenhas.length > 0 && (
            <section>
              <Titulo>resenhas recentes</Titulo>

              <ul className="mt-6 flex flex-col gap-4">
                {resenhas.map((r) => (
                  <li key={r.id} className="surface flex gap-5 p-6 sm:p-7">
                    <Link href={`/@${r.handle}`} aria-label={r.name ?? r.handle} className="shrink-0">
                      <Moldura coroa={coroas[r.handle] ?? null} src={r.image} name={r.name} handle={r.handle} size={48} />
                    </Link>

                    <Link href={`/livro/${r.slug}`} className="cover-lift w-12 shrink-0">
                      <Cover title={r.title} src={r.coverUrl} />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] text-[var(--color-ink-soft)]">
                        <Link href={`/@${r.handle}`} className="font-medium text-[var(--color-ink)] hover:underline">
                          {r.name ?? r.handle}
                        </Link>{" "}
                        sobre{" "}
                        <Link href={`/livro/${r.slug}`} className="voice text-[16px] text-[var(--color-ink)] hover:underline">
                          {r.title}
                        </Link>
                      </p>

                      <p className="voice mt-3 line-clamp-4 text-[16px] leading-relaxed text-[var(--color-ink)]">
                        {r.body}
                      </p>

                      <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                        {new Date(r.createdAt).toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ── 4. LENDO AGORA: uma vitrine, e não um ranking ────────── */}
          {lendo.length > 0 && (
            <section className="surface p-7 sm:p-8">
              <Titulo>estão lendo agora</Titulo>
              <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
                O que está aberto na mesa de alguém agora, sem nome e sem número: ou a capa te
                chama, ou não te chama.
              </p>

              <ul className="mt-7 grid grid-cols-4 gap-4 sm:grid-cols-6 sm:gap-5">
                {lendo.map((b) => (
                  <li key={b.slug}>
                    <Link href={`/livro/${b.slug}`} className="cover-lift block">
                      <Cover title={b.title} author={b.author} src={b.coverUrl} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
      {children}
    </h2>
  );
}

