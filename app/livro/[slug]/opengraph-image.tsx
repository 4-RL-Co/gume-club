import { ImageResponse } from "next/og";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { works, authors, editions } from "@/lib/db/schema";
import { Moldura, CapaTile, capa, fontes, TAMANHO, OSSO, FRACO } from "@/lib/og";

export const runtime = "nodejs";
export const size = TAMANHO;
export const contentType = "image/png";
export const alt = "Um livro, no Gume.";

/**
 * O pôster de um livro. A capa, o título, o autor.
 *
 * PÚBLICO de propósito, e tem que ser: quem abre isto é o robô do WhatsApp, que
 * não tem sessão e nunca vai ter. Por isso ele só lê a FICHA DO LIVRO, que é o
 * catálogo, que é de todo mundo. Nenhum dado de leitor entra aqui: nem quem leu,
 * nem quem tem, nem quem achou o quê. Ver lib/surface.test.ts.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [livro] = await db
    .select({
      title: works.title,
      author: authors.name,
      year: works.firstPublished,
      coverUrl: sql<string | null>`(
        select e.cover_url from editions e
         where e.work_id = ${works.id} and e.cover_url is not null
         order by e.created_at asc limit 1)`,
    })
    .from(works)
    .leftJoin(authors, eq(authors.id, works.authorId))
    .leftJoin(editions, eq(editions.workId, works.id))
    .where(eq(works.slug, slug))
    .limit(1);

  const titulo = livro?.title ?? "Um livro";
  const src = await capa(livro?.coverUrl ?? null);

  return new ImageResponse(
    (
      <Moldura>
        <div style={{ display: "flex", alignItems: "center", gap: 56, width: "100%" }}>
          <CapaTile src={src} title={titulo} largura={264} />

          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Voz",
                fontSize: titulo.length > 44 ? 52 : 68,
                lineHeight: 1.12,
                color: OSSO,
              }}
            >
              {titulo.slice(0, 90)}
            </div>

            {livro?.author && (
              <div
                style={{
                  display: "flex",
                  marginTop: 26,
                  fontFamily: "Voz",
                  fontSize: 30,
                  color: FRACO,
                }}
              >
                {livro.author}
                {livro.year ? `, ${livro.year < 0 ? `${Math.abs(livro.year)} a.C.` : livro.year}` : ""}
              </div>
            )}
          </div>
        </div>
      </Moldura>
    ),
    { ...size, fonts: fontes() },
  );
}
