#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  A COLEÇÃO DOSTOIÉVSKI — MARTIN CLARET, COMPLETA. 11 volumes, não 4.
 *
 *  O dono levantou os 11 títulos da edição gráfica tipográfica (capa dura) da
 *  Martin Claret direto na Amazon, um a um, com ISBN, tradutor, página e capa
 *  reais — e pediu para o catálogo e a coleção passarem a refletir isso:
 *  "crie/corrija os livros com base nisso e atualize a coleção... eu só tenho
 *  crime e castigo, mas atualize a coleção para mostrar os pendentes."
 *
 *  ═══ POR QUE ISTO NÃO É SÓ "ACRESCENTAR 7 LIVROS" ═══
 *
 *  O catálogo tinha, de novo, DOIS Dostoiévski: "Fyodor Dostoyevsky" (o
 *  sobrevivente da fusão anterior, scripts/dostoievski-desduplicado.mjs) e um
 *  TERCEIRO grafado "Fyodor Dostoevsky" (sem o Y), com 14 obras — 7 delas
 *  duplicando um título que o outro autor já tinha (Crime e Castigo, O
 *  Idiota, Os Demônios, Os Irmãos Karamázov, e um grupo de quatro fichas
 *  diferentes para "Diário do Subsolo": duas chamadas "Cadernos do
 *  Subterrâneo", uma "Memórias do Subsolo"). "O sósia" e "O jogador" também
 *  existiam, cada um sob DOIS títulos diferentes (um deles com o título
 *  literalmente quebrado: "O sósia Capa dura – 3 outubro 2022", resíduo de
 *  scraping) ou num alfabeto errado ("Игрокъ", em vez de "O jogador").
 *
 *  Cada par funde do jeito de sempre (fundirObras, em SQL cru, mesmo padrão
 *  de dostoievski-desduplicado.mjs): NENHUMA edição é apagada, só reagrupada.
 *  Só depois de nenhum título colidir mais é que os dois autores fundem.
 *
 *  ═══ TÍTULO CANÔNICO: O DA PLANILHA ═══
 *
 *  Onde o catálogo tinha uma grafia diferente da planilha (acento faltando,
 *  maiúscula solta, "&" em vez de "e"), o título vira o da planilha — é a
 *  fonte mais recente e mais conferida que existe aqui. "O duplo" virou "O
 *  sósia": duas traduções, dois títulos reais para o mesmo romance russo; a
 *  Martin Claret (a edição desta coleção) chama de "O sósia", então é esse
 *  que fica. O slug NÃO muda — é endereço, e nunca renomeia por trás de quem
 *  já linkou (mesma regra de editBook, em lib/curation.ts).
 *
 *  ═══ TRÊS EDIÇÕES JÁ EXISTIAM CERTAS ═══
 *
 *  Crime e Castigo, Os Demônios e O Idiota já tinham uma edição Martin Claret
 *  com o ISBN exato da planilha (import de verdade, de antes). Essas só
 *  ganham a capa e o que faltava; as outras 8 título ganham uma edição nova.
 *  `on conflict (isbn13)` cobre os dois casos com o mesmo código.
 *
 *  ═══ O VOLUME VIROU CRONOLOGIA DE VERDADE ═══
 *
 *  A convenção já era essa (perfil-modelo-colecao-livro.mjs: "não é sequência
 *  narrativa, é cronologia"), só que com 4 volumes ela não tinha como
 *  aparecer torta. Com os 11, ordena pelo ano da obra original — e os quatro
 *  que já eram volume 1/2/3/4 mudam de número (a ordem cronológica real não
 *  começa em Crime e Castigo).
 *
 *  ═══ AS CAPAS SOBEM PARA O BLOB, NÃO FICAM NO REPO ═══
 *
 *  As 11 fotos vieram em dosto/*.jpg, tiradas pelo dono na própria Amazon.
 *  Sobem para o Vercel Blob (mesmo mecanismo de lib/guardar.ts, mesmo token
 *  de produção) — imagem não é código, e o repo não é onde ela mora.
 *
 *  IDEMPOTENTE: cada fusão confere se a ficha "de" ainda existe antes de
 *  agir; cada edição usa `on conflict (isbn13)`; o upload sobe uma capa nova
 *  a cada execução (aceitável para um script de bootstrap rodado uma vez —
 *  não roda em cada deploy).
 *
 *      DATABASE_URL=... BLOB_READ_WRITE_TOKEN=... node scripts/dostoievski-colecao-completa.mjs
 * ════════════════════════════════════════════════════════════════════
 */
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import postgres from "postgres";
import { put } from "@vercel/blob";

const url =
  process.env.DATABASE_URL ??
  readFileSync(".env", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("DATABASE_URL não encontrado");

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!blobToken) throw new Error("BLOB_READ_WRITE_TOKEN não encontrado");

const sql = postgres(url);

const HANDLE_DONO = "olegas4real";
const AUTOR_PARA = "6e25fac5-f3da-47d1-ad0a-efeba1b9fd96"; // Fyodor Dostoyevsky — sobrevive
const AUTOR_DE = "f16880a5-a1cf-410e-ad91-321f5e27f29f"; // Fyodor Dostoevsky — vira apelido
const CONJUNTO_ID = "344072ec-e875-47a6-81ca-59d13a7bf00c"; // Dostoiévski — Martin Claret

const DOSTO_DIR = path.join(process.cwd(), "dosto");

const [dono] = await sql`select id, handle from users where handle = ${HANDLE_DONO}`;
if (!dono) throw new Error(`usuário "${HANDLE_DONO}" não encontrado`);

// ── 1. fundir as fichas duplicadas (mesmo livro, ficha diferente) ──────────

const FUSOES = [
  { de: "e7a56b03-96a6-4365-88cb-1093fa43943f", para: "26b132ad-a1f2-4769-8bfb-b190c7c8df76", rotulo: 'Crime e castigo ("Crime e Castigo")' },
  { de: "0c7603d3-107b-494c-a475-17630319bf4b", para: "a7f9f8c5-7ed6-4e51-96a5-9953c63ee0cb", rotulo: 'O idiota ("O Idiota")' },
  { de: "9b10ed40-dfb5-43ff-a1db-d2c6add2132c", para: "c6e80004-729e-451e-b497-a8189fe2a84b", rotulo: "Os demônios (duplicata)" },
  { de: "aeb40841-3f04-4093-884c-217efe30c62e", para: "82e3a619-9ef5-4dbb-bd2e-8444dc54cdf2", rotulo: "Os irmãos Karamázov (duplicata)" },
  { de: "3b7f9500-0121-4434-8275-dc789c27358e", para: "bb900dfa-45fc-4477-926d-1494468aeedf", rotulo: 'Diário do subsolo ("Cadernos do Subterrâneo" #1)' },
  { de: "d4c99524-838e-4fc3-98b8-e4e6bf401cbf", para: "bb900dfa-45fc-4477-926d-1494468aeedf", rotulo: 'Diário do subsolo ("Cadernos do Subterrâneo" #2)' },
  { de: "fe2a0cf7-841a-4244-a8e0-7f5a2683d489", para: "bb900dfa-45fc-4477-926d-1494468aeedf", rotulo: 'Diário do subsolo ("Memórias do Subsolo")' },
  { de: "2b1b503b-8dfa-4890-b6de-37d9ef03febc", para: "ccde0941-89a1-44dc-9e59-de37da0c2f64", rotulo: 'O sósia (título quebrado "...Capa dura – 3 outubro 2022")' },
  { de: "b9fa537f-a37e-4cc4-af56-26adad2cbced", para: "b48dcd2a-9986-4306-a3ab-e0017c320eec", rotulo: 'O jogador ("Игрокъ", título em russo)' },
  { de: "e4b2d003-c952-4f3f-a950-3eac8967395c", para: "3c0d96ca-e4cf-4c1c-80f1-a2bc0c90d4f1", rotulo: "Noites Brancas (duplicata, fora desta coleção)" },
];

async function fundirObra(tx, deId, paraId, rotulo) {
  const [de] = await tx`select id, slug from works where id = ${deId}`;
  if (!de) {
    console.log(`· ${rotulo}: já estava fundida, nada a fazer`);
    return;
  }
  for (const tabela of [
    "editions", "library_entries", "ratings", "reviews",
    "activities", "owned_copies", "recommendations", "collection_items",
    "autor_conhecido_nao_gravado",
  ]) {
    await tx`update ${tx(tabela)} set work_id = ${paraId} where work_id = ${deId}`;
  }
  await tx`
    insert into revisions (user_id, target_type, target_id, patch, previous, reason)
    values (
      ${dono.id}, 'work', ${paraId},
      ${sql.json({ fundidaCom: rotulo, edicoesMovidas: true })},
      ${sql.json({ slug: de.slug })},
      'Coleção Dostoiévski — Martin Claret completa: duas fichas para o mesmo livro'
    )`;
  await tx`delete from works where id = ${deId}`;
  console.log(`✓ fundida: ${rotulo}`);
}

await sql.begin(async (tx) => {
  for (const f of FUSOES) await fundirObra(tx, f.de, f.para, f.rotulo);
});

// ── 2. fundir os dois autores, só depois de nenhum título colidir mais ────

const [aindaDuplicado] = await sql`select id, name from authors where id = ${AUTOR_DE}`;
if (aindaDuplicado) {
  const [choque] = await sql`
    select exists (
      select 1 from works a join works b
        on b.title = a.title and coalesce(b.volume, -1) = coalesce(a.volume, -1)
      where a.author_id = ${AUTOR_DE} and b.author_id = ${AUTOR_PARA}
    ) as existe`;
  if (choque.existe) {
    throw new Error("ainda há obra duplicada entre os dois autores — a fusão de obras não terminou certo");
  }

  await sql.begin(async (tx) => {
    const [para] = await tx`select name from authors where id = ${AUTOR_PARA}`;

    await tx`update works  set author_id = ${AUTOR_PARA} where author_id = ${AUTOR_DE}`;
    await tx`update series set author_id = ${AUTOR_PARA} where author_id = ${AUTOR_DE}`;
    await tx`update series set illustrator_id = ${AUTOR_PARA} where illustrator_id = ${AUTOR_DE}`;

    await tx`
      update authors p
         set alt_names = (
           select array(
             select distinct x
               from unnest(coalesce(p.alt_names, '{}'::text[]) || coalesce(d.alt_names, '{}'::text[]) || array[d.name]) as x
              where x is not null and x <> '' and x <> p.name
           ))
        from authors d
       where p.id = ${AUTOR_PARA} and d.id = ${AUTOR_DE}`;

    await tx`
      insert into revisions (user_id, target_type, target_id, patch, previous, reason)
      values (
        ${dono.id}, 'author', ${AUTOR_PARA},
        ${sql.json({ fundidoCom: aindaDuplicado.name, livrosMovidos: true })},
        ${sql.json({ name: para.name })},
        'a mesma pessoa, grafada de três formas: Fyodor Dostoyevsky, Fiódor Dostoiévski (já fundido antes) e Fyodor Dostoevsky'
      )`;

    await tx`delete from authors where id = ${AUTOR_DE}`;
  });
  console.log('✓ "Fyodor Dostoevsky" fundido em "Fyodor Dostoyevsky"');
} else {
  console.log("· os autores já estavam fundidos, nada a fazer");
}

// ── 3. os 11 volumes: título certo, edição Martin Claret, capa, volume ────

/** Ordem = cronologia da obra ORIGINAL (não da edição, não narrativa) — a
    mesma régua que perfil-modelo-colecao-livro.mjs já usava para os 4
    primeiros. Com os 11, os 4 antigos mudam de número: a Martin Claret não
    começa a coleção em Crime e Castigo. */
const VOLUMES = [
  {
    work: "9415741f-64f9-4959-9208-67fb6880bb16", titulo: "Gente Pobre e A Anfitriã",
    tradutor: "Oleg Almeida", ano: 2021, isbn13: "9786559100491", isbn10: "6559100499",
    paginas: 238, img: "gente pobre.jpg",
  },
  {
    work: "ccde0941-89a1-44dc-9e59-de37da0c2f64", titulo: "O sósia",
    tradutor: "Oleg Almeida", ano: 2022, isbn13: "9786559101337", isbn10: "6559101339",
    paginas: 196, img: "sosia.jpg",
  },
  {
    work: "47bd7f1a-ed0c-41a1-8625-7909243d01d1", titulo: "Início e fim",
    tradutor: "Oleg Almeida", ano: 2019, isbn13: "9788544002148", isbn10: "8544002145",
    paginas: 228, img: "inicio.jpg",
  },
  {
    work: "72594cad-4ebe-4c6d-9b7b-070c97897712", titulo: "Memórias da casa dos mortos",
    tradutor: "Oleg Almeida", ano: 2019, isbn13: "9788544002247", isbn10: "8544002242",
    paginas: 336, img: "memorias.jpg",
  },
  {
    work: "a18da5de-d510-4465-905e-4629c3b512a5", titulo: "Humilhados e ofendidos",
    tradutor: "Oleg Almeida", ano: 2019, isbn13: "9788544002230", isbn10: "8544002234",
    paginas: 412, img: "humilhados.jpg",
  },
  {
    work: "bb900dfa-45fc-4477-926d-1494468aeedf", titulo: "Diário do subsolo",
    tradutor: "Oleg Almeida", ano: 2019, isbn13: "9788544002346", isbn10: "854400234X",
    paginas: 132, img: "diario.jpg",
  },
  {
    work: "26b132ad-a1f2-4769-8bfb-b190c7c8df76", titulo: "Crime e castigo",
    tradutor: "Oleg Almeida", ano: 2019, isbn13: "9788544002162", isbn10: "8544002161",
    paginas: 584, img: "crime.jpg",
  },
  {
    work: "b48dcd2a-9986-4306-a3ab-e0017c320eec", titulo: "O jogador",
    tradutor: "Oleg Almeida", ano: 2019, isbn13: "9788544002360", isbn10: "8544002366",
    paginas: 160, img: "jogador.jpg",
  },
  {
    work: "a7f9f8c5-7ed6-4e51-96a5-9953c63ee0cb", titulo: "O idiota",
    tradutor: "José Geraldo Vieira (rev. técnica Oleg Almeida)", ano: 2019,
    isbn13: "9788544001882", isbn10: "8544001882", paginas: 712, img: "idiota.jpg",
  },
  {
    work: "c6e80004-729e-451e-b497-a8189fe2a84b", titulo: "Os demônios",
    tradutor: "Oleg Almeida", ano: 2020, isbn13: "9786586014891", isbn10: "6586014891",
    paginas: 784, img: "demon.jpg",
  },
  {
    work: "82e3a619-9ef5-4dbb-bd2e-8444dc54cdf2", titulo: "Os irmãos Karamázov",
    tradutor: "Herculano Villas-Boas", ano: 2019, isbn13: "9788544002193", isbn10: "8544002196",
    paginas: 920, img: "irmaos.jpg",
  },
];

for (const [i, v] of VOLUMES.entries()) {
  const volume = i + 1;

  const bytes = readFileSync(path.join(DOSTO_DIR, v.img));
  const { url: coverUrl } = await put(`capas/${randomUUID()}.jpg`, bytes, {
    access: "public",
    contentType: "image/jpeg",
    token: blobToken,
    addRandomSuffix: false,
  });

  await sql.begin(async (tx) => {
    await tx`
      update works set title = ${v.titulo}, colecao_id = ${CONJUNTO_ID}, volume = ${volume}
       where id = ${v.work}::uuid`;

    const [edicao] = await tx`
      insert into editions (work_id, isbn13, publisher, published_year, translator, page_count, format, cover_url, language)
      values (${v.work}::uuid, ${v.isbn13}, 'Martin Claret', ${v.ano}, ${v.tradutor}, ${v.paginas}, 'hardcover', ${coverUrl}, 'pt-BR')
      on conflict (isbn13) do update
        set work_id = excluded.work_id, publisher = excluded.publisher, published_year = excluded.published_year,
            translator = excluded.translator, page_count = excluded.page_count, format = excluded.format,
            cover_url = excluded.cover_url
      returning id`;

    await tx`
      insert into identifiers (edition_id, kind, value) values (${edicao.id}, 'isbn13', ${v.isbn13})
      on conflict (kind, value) do update set edition_id = excluded.edition_id`;
    await tx`
      insert into identifiers (edition_id, kind, value) values (${edicao.id}, 'isbn10', ${v.isbn10})
      on conflict (kind, value) do update set edition_id = excluded.edition_id`;
  });

  console.log(`✓ ${volume}. ${v.titulo} (${v.ano}) — edição Martin Claret e capa`);
}

// ── 4. a coleção sabe agora que são 11, e só "Crime e castigo" é tido ─────

await sql`update colecoes set total_volumes = ${VOLUMES.length} where id = ${CONJUNTO_ID}::uuid`;

const CRIME_E_CASTIGO = "26b132ad-a1f2-4769-8bfb-b190c7c8df76";
const EDICAO_CRIME_E_CASTIGO = "2a4b3b31-d064-472a-96f7-2b5fcb330d34"; // a Martin Claret desta coleção

const [jaTem] = await sql`
  select id, edition_id from owned_copies where user_id = ${dono.id} and work_id = ${CRIME_E_CASTIGO}`;
if (!jaTem) {
  await sql`
    insert into owned_copies (user_id, work_id, state, edition_id)
    values (${dono.id}, ${CRIME_E_CASTIGO}, 'owned', ${EDICAO_CRIME_E_CASTIGO})`;
  console.log('✓ "Crime e castigo" marcado como "tenho", com a edição Martin Claret desta coleção');
} else {
  /**
   * A EDIÇÃO só é preenchida se estava vazia — mesma regra de setPosse, em
   * lib/copies.ts: quem escolheu a sua a dedo escolheu, e este script não desfaz
   * isso. Sem a edição certa aqui, a ficha do livro (app/livro/[slug]/page.tsx)
   * não sabe qual é "a sua", e cai no desempate genérico — que é exatamente o
   * "continua com a capa errada" de novo, um livro adiante.
   */
  if (!jaTem.edition_id) {
    await sql`update owned_copies set edition_id = ${EDICAO_CRIME_E_CASTIGO} where id = ${jaTem.id}`;
    console.log('✓ "Crime e castigo" já era "tenho" — completado com a edição Martin Claret desta coleção');
  } else {
    console.log('· "Crime e castigo" já estava marcado como "tenho", com edição já escolhida');
  }
}

console.log(`\n✓ "Dostoiévski — Martin Claret" completa: ${VOLUMES.length} volumes, 1 tido (Crime e castigo).`);

await sql.end();
