import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertOwner, type Viewer } from "@/lib/authz";
import { findOrCreateWork } from "@/lib/library";
import { slugify } from "@/lib/slug";
import { fromStars } from "@/lib/veredito";
import { LIMITS } from "@/lib/limits";
import type { LivroImportado, Relatorio } from "@/lib/import/tipos";

/**
 * ════════════════════════════════════════════════════════════════════
 *  GRAVAR A ESTANTE IMPORTADA.
 *
 *  ═══ NÃO EXISTE UM SEGUNDO CASAMENTO DE LIVRO ═══
 *
 *  Este módulo NÃO adivinha qual livro é qual: ele chama o
 *  `findOrCreateWork()` que já existe, e que casa por ISBN, depois pela
 *  chave da Open Library, depois por título + autor. Esse matcher é
 *  escrito à mão e revisado à mão (ver AGENTS.md, "não vibe-code
 *  estes"), e um segundo, escrito aqui, seria uma segunda verdade sobre
 *  o que é o mesmo livro.
 *
 *  ═══ O IMPORT NÃO ESCREVE NO FEED ═══
 *
 *  E isto não é esquecimento. Alguém importando 200 livros do Goodreads
 *  geraria 200 atividades, e o feed de todos os amigos dela viraria uma
 *  parede de ruído no mesmo minuto. O feed é para o que a pessoa está
 *  lendo AGORA, e não para o que ela leu em 2013. Um importador que
 *  entope o feed é um importador que ninguém perdoa duas vezes.
 * ════════════════════════════════════════════════════════════════════
 */

export async function aplicar(
  actor: { id: string },
  livros: LivroImportado[],
): Promise<Relatorio> {
  // A linha que estamos prestes a escrever é a do próprio ator. Afirmado, e nunca
  // suposto: é a mesma checagem que toda escrita deste app faz.
  assertOwner(actor as Viewer, { userId: actor.id });

  const relatorio: Relatorio = {
    linhas: livros.length,
    entraram: 0,
    novos: 0,
    perdidos: [],
    avisos: [],
  };

  /** As estantes inventadas, criadas uma vez só e reusadas. */
  const estantes = new Map<string, string>();

  let semData = 0;

  for (const livro of livros.slice(0, LIMITS.importLinhas)) {
    try {
      const { workId, editionId } = await findOrCreateWork({
        title: livro.titulo,
        author: livro.autor,
        isbn13: livro.isbn13,
        isbn10: livro.isbn10,
        publisher: livro.editora,
        publishedYear: livro.anoEdicao,
        firstPublished: livro.anoObra,
        pageCount: livro.paginas,
        // CAPA DURA OU BROCHURA. A coluna "Binding" do Goodreads era jogada fora, e ela
        // é o que diz se a pessoa coleciona objetos ou arquivos. Ver lib/import/parse.ts.
        formato: livro.formato,
        // Veio de uma estante de verdade, e não de um catálogo: um bibliotecário
        // confere a ficha depois. O livro já está na estante da pessoa enquanto
        // isso, e não é um livro de segunda classe.
        needsReview: true,
        // Importar uma estante TRAZ livro para o acervo, e isso é contribuição igual
        // ao cadastro a mão: as fichas que nascem aqui servem todo mundo depois.
        criadoPor: actor.id,
      });

      // ── a estante ──────────────────────────────────────────────────
      await db.execute(sql`
        insert into library_entries (user_id, work_id, status, edition_id)
        values (${actor.id}::uuid, ${workId}::uuid, ${livro.status}, ${editionId}::uuid)
        on conflict (user_id, work_id) do update
          set status = excluded.status,
              status_at = now()`);

      const [entrada] = await db.execute<{ id: string }>(sql`
        select id from library_entries
         where user_id = ${actor.id}::uuid and work_id = ${workId}::uuid`);
      if (!entrada) throw new Error("a linha da estante não gravou");

      // ── as leituras. Reler é de primeira classe. ───────────────────
      //
      // Apaga e regrava as leituras DESTE livro antes de inserir: reimportar o
      // mesmo arquivo não pode duplicar leituras. É o teste que separa um
      // importador de um gerador de lixo.
      if (livro.leituras.length > 0) {
        await db.execute(sql`delete from readings where entry_id = ${entrada.id}::uuid`);

        for (const l of livro.leituras) {
          if (!l.terminou && !l.abandonou && !l.comecou) semData++;
          await db.execute(sql`
            insert into readings (entry_id, started_on, finished_on, abandoned_on)
            values (${entrada.id}::uuid, ${l.comecou}::date, ${l.terminou}::date,
                    ${l.abandonou}::date)`);
        }
      }

      // ── a nota. Estrela vira PALAVRA, degrau por degrau. ───────────
      if (livro.estrelas !== null) {
        const palavra = fromStars(livro.estrelas);
        if (palavra !== null) {
          await db.execute(sql`
            insert into ratings (user_id, work_id, value)
            values (${actor.id}::uuid, ${workId}::uuid, ${palavra})
            on conflict (user_id, work_id) do update set value = excluded.value`);
        }
      }

      // ── a resenha, e a nota privada ────────────────────────────────
      if (livro.resenha || livro.notaPrivada) {
        const corpo = (livro.resenha ?? "").slice(0, LIMITS.review);
        const nota = livro.notaPrivada?.slice(0, LIMITS.review) ?? null;

        await db.execute(sql`
          insert into reviews (user_id, work_id, body, private_note, visibility)
          values (${actor.id}::uuid, ${workId}::uuid, ${corpo}, ${nota}, 'private')
          on conflict (user_id, work_id) do update
            set body = excluded.body,
                private_note = excluded.private_note,
                updated_at = now()`);
      }

      // ── as prateleiras que ELA inventou ────────────────────────────
      for (const nome of livro.prateleiras) {
        const limpo = nome.slice(0, LIMITS.shelfName);
        let id = estantes.get(limpo.toLowerCase());

        if (!id) {
          const slug = slugify(limpo) || "estante";
          const [criada] = await db.execute<{ id: string }>(sql`
            insert into collections (user_id, slug, name)
            values (${actor.id}::uuid, ${slug}, ${limpo})
            on conflict (user_id, slug) do update set name = excluded.name
            returning id`);
          if (!criada) continue;
          id = criada.id;
          estantes.set(limpo.toLowerCase(), id);
        }

        await db.execute(sql`
          insert into collection_items (collection_id, work_id)
          values (${id}::uuid, ${workId}::uuid)
          on conflict do nothing`);
      }

      // ── ter não é ler ──────────────────────────────────────────────
      if (livro.possui) {
        await db.execute(sql`
          insert into owned_copies (user_id, work_id, edition_id, state)
          values (${actor.id}::uuid, ${workId}::uuid, ${editionId}::uuid, 'owned')
          on conflict (user_id, work_id) do nothing`);
      }

      relatorio.entraram++;
    } catch (erro) {
      // Um livro que falha não derruba os outros 199. A pessoa esperou por este
      // arquivo, e "deu erro" no meio de 200 livros é a pior resposta possível.
      relatorio.perdidos.push({
        linha: livro.titulo,
        porque: erro instanceof Error ? erro.message : "não deu para gravar",
      });
    }
  }

  if (livros.length > LIMITS.importLinhas) {
    relatorio.avisos.push(
      `O arquivo tinha ${livros.length} livros, e entraram os primeiros ${LIMITS.importLinhas}. Importe de novo para trazer o resto.`,
    );
  }
  if (semData > 0) {
    relatorio.avisos.push(
      `${semData} ${semData === 1 ? "leitura veio" : "leituras vieram"} sem data. A leitura ficou registrada: só o dia é que não veio no arquivo.`,
    );
  }

  return relatorio;
}
