import { ImageResponse } from "next/og";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { visibleTo } from "@/lib/authz";
import { collections, collectionItems, users } from "@/lib/db/schema";
import { Moldura, CapaTile, capas, fontes, TAMANHO, OSSO, FRACO } from "@/lib/og";

export const runtime = "nodejs";
export const size = TAMANHO;
export const contentType = "image/png";
export const alt = "Uma estante, no Gume.";

/**
 * O pôster de uma estante inventada. As capas dela, o nome dela, de quem ela é.
 *
 * PÚBLICO de propósito: quem abre isto é o robô do WhatsApp, sem sessão. E é por
 * isso que a visibilidade passa pelo `visibleTo(null, ...)`, e não por um
 * `visibility = 'public'` escrito à mão: uma estante PRIVADA não pode virar pôster.
 *
 * Este é o caso em que o vazamento seria mais caro de todos: a pessoa deu o nome
 * "livros que me dão medo" a uma estante privada, e o pôster mandaria a lista para
 * um grupo de WhatsApp. Ver SECURITY.md.
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [estante] = await db
    .select({
      id: collections.id,
      name: collections.name,
      handle: users.handle,
      dono: users.displayName,
    })
    .from(collections)
    .innerJoin(users, eq(users.id, collections.userId))
    .where(and(
      eq(collections.slug, slug),
      // O robô é um estranho. Estante privada não existe para ele.
      visibleTo(null, collections.userId, collections.visibility),
    ))
    .limit(1);

  if (!estante) {
    return new ImageResponse(
      (
        <Moldura>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "Voz",
              fontSize: 44,
              color: FRACO,
            }}
          >
            Esta estante não existe.
          </div>
        </Moldura>
      ),
      { ...size, fonts: fontes() },
    );
  }

  const linhas = await db
    .select({
      /** `collection_items.work_id` à mão: ver o comentário longo no pôster do
       *  perfil. Sem join, o drizzle não qualifica a coluna externa, e a
       *  subconsulta deixa de ser correlacionada sem avisar ninguém. */
      coverUrl: sql<string | null>`(
        select e.cover_url from editions e
         where e.work_id = collection_items.work_id and e.cover_url is not null
         order by e.created_at asc limit 1)`,
    })
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, estante.id))
    .orderBy(collectionItems.position, collectionItems.addedAt)
    .limit(24);

  const parede = await capas(linhas.map((l) => l.coverUrl), 7);

  return new ImageResponse(
    (
      <Moldura>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ display: "flex", fontFamily: "Voz", fontSize: 62, color: OSSO }}>
            {estante.name.slice(0, 36)}
          </div>
          <div
            style={{ display: "flex", marginTop: 14, fontFamily: "Voz", fontSize: 28, color: FRACO }}
          >
            uma estante de {estante.dono ?? `@${estante.handle}`}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 46 }}>
            {parede.map((src, i) => (
              <CapaTile key={i} src={src} title="" largura={140} />
            ))}
          </div>

          {parede.length === 0 && (
            <div
              style={{
                display: "flex",
                marginTop: 50,
                fontFamily: "Voz",
                fontSize: 30,
                color: FRACO,
              }}
            >
              Uma estante que está começando.
            </div>
          )}
        </div>
      </Moldura>
    ),
    { ...size, fonts: fontes() },
  );
}
