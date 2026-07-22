import { notFound } from "next/navigation";
import Image from "next/image";
import { origemAceita } from "@/lib/imagens";
import Link from "next/link";
import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { getViewer } from "@/lib/viewer";
import { souBibliotecario } from "@/lib/corrections";
import { Cover } from "@/components/cover";
import { Prosa } from "@/components/prosa";
import { ScreenHeader } from "@/components/screen-header";
import { Empty } from "@/components/empty";
import { AuthorEdit } from "@/components/author-edit";

export const dynamic = "force-dynamic";

/**
 * O autor como LUGAR, e não como uma linha de texto cinza embaixo do título.
 *
 * Ele existe porque a busca precisa dele: quem digita "machado de assis" quer o
 * autor, e não os livros escritos SOBRE ele. Sem um lugar para onde mandar essa
 * pessoa, a busca só sabia devolver uma lista e torcer para o ranking acertar.
 *
 * A obra é do catálogo, e o catálogo é comum: esta página não mostra nada de
 * ninguém, então não há visibilidade a filtrar aqui. No dia em que ela mostrar
 * "quem que você segue leu este autor", ela passa pelo visibleTo(), como todo o
 * resto. Ver SECURITY.md.
 */
async function getAutor(slug: string) {
  const [autor] = await db.execute<{
    id: string;
    name: string;
    nationality: string | null;
    bio: string | null;
    bio_source: string | null;
    image_url: string | null;
    image_source: string | null;
    works: number;
  }>(sql`
    select a.id, a.name, a.nationality, a.bio, a.bio_source, a.image_url, a.image_source,
           (select count(*)::int from works w where w.author_id = a.id) as works
      from authors a
     where a.slug = ${slug}
     limit 1`);

  return autor ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const autor = await getAutor((await params).slug);
  if (!autor) return {};
  return { title: `${autor.name} · Gume`, description: `As obras de ${autor.name}.` };
}

export default async function Autor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const autor = await getAutor(slug);
  if (!autor) notFound();

  const viewer = await getViewer();
  const bibliotecario = await souBibliotecario(viewer);

  const obras = await db.execute<{
    slug: string;
    title: string;
    first_published: number | null;
    cover_url: string | null;
  }>(sql`
    select w.slug, w.title, w.first_published,
           (select e.cover_url from editions e
             where e.work_id = w.id and e.cover_url is not null
             order by e.created_at limit 1) as cover_url
      from works w
      join authors a on a.id = w.author_id
     where a.slug = ${slug}
     -- com capa primeiro: capa é o sinal barato de que aquilo é uma edição de
     -- verdade, e não uma ficha órfã do dump. Ver a nota em ai/DECISIONS.md.
     order by (exists (
                select 1 from editions e2
                 where e2.work_id = w.id and e2.cover_url is not null)) desc,
              w.first_published asc nulls last,
              w.title asc
     limit 60`);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 sm:px-10">
      <ScreenHeader
        title={autor.name}
        meta={[
          `${autor.works} ${autor.works === 1 ? "obra" : "obras"}`,
          autor.nationality,
        ]}
      />

      {/* A FICHA DO AUTOR. Retrato, quem foi, e o convite para arrumar.
          Nada disso existia: o nome vinha do dump escrito de qualquer jeito, a
          nacionalidade estava quase toda vazia, e não havia como um leitor
          consertar. A edição era corrigível desde o começo; o autor, não. */}
      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {autor.image_url && origemAceita(autor.image_url) && (
          /* ═══ A FOTO É DE ALGUÉM, E ELA É MOSTRADA DA ORIGEM ═══

             O retrato de um autor é obra de um fotógrafo. O Gume guarda o ENDEREÇO e
             mostra de lá: mostrar não é republicar, e baixar o arquivo seria.

             O crédito embaixo não é gentileza. A foto do Wikimedia Commons quase nunca
             é CC0 — em geral é CC-BY-SA ou domínio público, e a licença exige atribuição.
             Mostrar sem creditar seria o mesmo erro que copiar a sinopse de uma loja. */
          <figure className="shrink-0">
            <Image
              src={autor.image_url}
              alt={`Retrato de ${autor.name}`}
              width={112}
              height={112}
              sizes="112px"
              className="h-28 w-28 rounded-full object-cover"
              style={{ border: "1px solid var(--color-rule)" }}
            />
            {autor.image_source && (
              <figcaption className="mt-2 w-28 text-center text-[11px] text-[var(--color-ink-faint)]">
                {autor.image_source === "wikidata"
                  ? "foto do Wikimedia Commons"
                  : "foto da Open Library"}
              </figcaption>
            )}
          </figure>
        )}

        <div className="min-w-0 flex-1">
          {autor.bio ? (
            /* A bio chega em markdown, e ela sai daqui como frase. Ver lib/texto.ts.
               O crédito vem junto: o texto do Wikidata e o da Open Library são CC0 e
               entram no dataset aberto; o da Wikipédia é CC-BY-SA e não entra. Dizer de
               onde veio é o que separa uma promessa de uma propaganda. */
            <Prosa texto={autor.bio} fonte={autor.bio_source} />
          ) : (
            <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--color-ink-faint)]">
              Ninguém escreveu ainda quem foi essa pessoa. Se você souber e tiver vontade, pode
              escrever.
            </p>
          )}

          {viewer && (
            <div className="mt-5">
              <AuthorEdit
                authorId={autor.id}
                slug={slug}
                atual={{
                  name: autor.name,
                  nationality: autor.nationality,
                  bio: autor.bio,
                  imageUrl: autor.image_url,
                }}
                bibliotecario={bibliotecario}
              />
            </div>
          )}
        </div>
      </div>

      {obras.length === 0 ? (
        <Empty>Ainda não temos nenhuma obra deste autor por aqui.</Empty>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5 lg:grid-cols-5">
          {obras.map((o) => (
            <li key={o.slug}>
              <Link href={`/livro/${o.slug}`} className="card flex h-full flex-col items-center p-5 text-center">
                <span className="cover-lift block w-[70%]">
                  <Cover title={o.title} author={autor.name} src={o.cover_url} />
                </span>
                <span className="voice mt-4 line-clamp-2 text-[14px] leading-snug">{o.title}</span>
                {o.first_published && (
                  <span className="tabular mt-1 text-[11px] text-[var(--color-ink-faint)]">
                    {o.first_published}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
