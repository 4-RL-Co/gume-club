import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Viewer } from "@/lib/authz";
import { podeSerDescoberto } from "@/lib/descoberta";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ACHAR UMA PESSOA.
 *
 *  É o cano que decide se o Gume vira uma rede ou uma planilha. Dez
 *  amigos se cadastram, nenhum acha o outro, e cada um fica sozinho
 *  numa estante olhando um feed vazio. O app não parece quebrado: ele
 *  parece MORTO, e ninguém abre um chamado sobre um app que parece
 *  morto. Ele só desinstala.
 *
 *  ═══ PERDOAR É O TRABALHO ═══
 *
 *  Isto usava `LIKE '%texto%'`, que perdoa ACENTO e não perdoa mais
 *  nada: "clarise" não achava "Clarice", "victoria" não achava
 *  "Vitória". Ninguém digita o nome do amigo certo na primeira vez, e
 *  um app que responde "não achei ninguém" para quem digitou o nome do
 *  PRÓPRIO AMIGO com uma letra trocada é um app que mente.
 *
 *  Trigrama com unaccent, o mesmo do catálogo (ver lib/catalog.ts e a
 *  migration 0013). E `word_similarity`, e não `similarity`: ela compara
 *  o que a pessoa digitou com a MELHOR PALAVRA do nome, e não com o nome
 *  inteiro. Quase ninguém digita "Maria Vitória Alcântara": digita
 *  "vitoria". Contra o nome inteiro isso marca 0.28 e some; contra a
 *  melhor palavra, marca 1.00.
 *
 *  Essa lição já foi aprendida TRÊS VEZES no catálogo, e está escrita
 *  lá: comparar o que a pessoa digitou com o NOME INTEIRO exige que ela
 *  saiba o nome inteiro, e ninguém sabe.
 * ════════════════════════════════════════════════════════════════════
 */

export type Pessoa = {
  id: string;
  handle: string;
  displayName: string | null;
  image: string | null;
  bio: string | null;
};

export async function searchPeople(
  viewer: Viewer,
  rawQuery: string,
  limite = 6,
): Promise<Pessoa[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const rows = await db.execute<{
    id: string; handle: string; display_name: string | null;
    image: string | null; bio: string | null;
  }>(sql`
    select u.id, u.handle, u.display_name, u.image, u.bio
      from users u
     where u.deleted_at is null
       -- BANIDO não é um resultado.
       and u.banned_at is null
       -- E-MAIL NÃO VERIFICADO TAMBÉM NÃO APARECE NA BUSCA.
       --
       -- Não é punição, e não bloqueia nada: quem não verificou usa o app inteiro. O
       -- que ele não tem é DESCOBERTA: não aparece aqui, não aparece no explorar, e o
       -- perfil dele é noindex. Com cadastro aberto, esse é o portão anti-spam
       -- inteiro. Uma conta que ninguém acha e que o Google não indexa não serve
       -- para spam nenhum.
       and ${podeSerDescoberto}
       -- Uma conta privada não aparece na busca de ninguém. Ela não é um
       -- resultado "escondido": ela não é um resultado.
       and u.is_private = false
       ${viewer ? sql`and u.id <> ${viewer.id}::uuid` : sql``}
       and (
         immutable_unaccent(lower(${query})) <% immutable_unaccent(lower(u.handle))
         or immutable_unaccent(lower(${query}))
            <% immutable_unaccent(lower(coalesce(u.display_name, '')))
       )
     order by
       -- O DESEMPATE, e ele importa: quem digita um handle inteiro quer AQUELA
       -- pessoa, e não alguém com nome parecido. O handle é um endereço, e
       -- endereço é exato: ele ganha de qualquer semelhança de nome.
       (immutable_unaccent(lower(u.handle)) = immutable_unaccent(lower(${query}))) desc,
       greatest(
         word_similarity(immutable_unaccent(lower(${query})),
                         immutable_unaccent(lower(u.handle))),
         word_similarity(immutable_unaccent(lower(${query})),
                         immutable_unaccent(lower(coalesce(u.display_name, ''))))
       ) desc,
       u.handle asc
     limit ${limite}`);

  return rows.map((r) => ({
    id: r.id,
    handle: r.handle,
    displayName: r.display_name,
    image: r.image,
    bio: r.bio,
  }));
}
