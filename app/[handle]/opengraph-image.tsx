import { ImageResponse } from "next/og";
import { and, eq, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { visibleTo } from "@/lib/authz";
import { users, libraryEntries } from "@/lib/db/schema";
import { Moldura, CapaTile, capas, fontes, TAMANHO, OSSO, FRACO } from "@/lib/og";

export const runtime = "nodejs";
export const size = TAMANHO;
export const contentType = "image/png";
export const alt = "Uma estante, no Gume.";

/**
 * O pôster de uma pessoa. A parede de capas dela, o nome, o handle.
 *
 * PÚBLICO de propósito: quem abre isto é o robô do WhatsApp, e ele nunca vai ter
 * sessão. Por isso o `visibleTo(null, ...)`, que é a MESMA regra de visibilidade
 * do resto do app, com um estranho no lugar do leitor: só linha pública entra.
 *
 * Escrever `visibility = 'public'` aqui em SQL cru seria uma segunda cópia da
 * autorização fora do lib/authz.ts, e é exatamente o que o SECURITY.md proíbe: no
 * dia em que a regra mudasse lá, este pôster continuaria com a antiga, e ele é a
 * superfície MAIS pública que existe. Um vazamento aqui vai parar num grupo de
 * WhatsApp.
 */
export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const limpo = handle.replace(/^@/, "");

  const [dono] = await db
    .select({ id: users.id, handle: users.handle, name: users.displayName })
    .from(users)
    .where(and(eq(users.handle, limpo), sql`${users.deletedAt} is null`))
    .limit(1);

  if (!dono) {
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

  // Só o que um ESTRANHO pode ver. O viewer é null: é o robô, e ele é um estranho.
  const linhas = await db
    .select({
      /**
       * `library_entries.work_id` está escrito À MÃO, e isso NÃO é descuido.
       *
       * Numa consulta SEM join, o drizzle renderiza a coluna externa sem o nome
       * da tabela: `${libraryEntries.workId}` vira `"work_id"`. Dentro da
       * subconsulta, `"work_id"` não aponta para a linha de fora: ele resolve
       * para a coluna da PRÓPRIA `editions e`. A condição vira `e.work_id =
       * e.work_id`, que é sempre verdadeira, a correlação morre EM SILÊNCIO, e o
       * pôster sai com a primeira capa do catálogo repetida sete vezes.
       *
       * (Com join, o drizzle qualifica certo, e é por isso que lib/shelf.ts não
       * tem esse problema. Uma subconsulta correlacionada não pode depender de
       * qual forma a consulta de fora tem.)
       */
      coverUrl: sql<string | null>`(
        select e.cover_url from editions e
         where e.work_id = library_entries.work_id and e.cover_url is not null
         order by e.created_at asc limit 1)`,
    })
    .from(libraryEntries)
    .where(and(
      eq(libraryEntries.userId, dono.id),
      visibleTo(null, libraryEntries.userId, libraryEntries.visibility),
    ))
    .orderBy(desc(libraryEntries.addedAt))
    .limit(24);

  const parede = await capas(linhas.map((l) => l.coverUrl), 7);

  return new ImageResponse(
    (
      <Moldura>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ display: "flex", fontFamily: "Voz", fontSize: 66, color: OSSO }}>
            {(dono.name ?? dono.handle).slice(0, 34)}
          </div>
          <div
            style={{ display: "flex", marginTop: 14, fontFamily: "Voz", fontSize: 30, color: FRACO }}
          >
            @{dono.handle}
          </div>

          {/* A parede. As capas SÃO o argumento: ninguém clica num texto sobre
              livros, e todo mundo olha uma parede de capas. */}
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
