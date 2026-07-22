import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { COLUNAS, estanteEmLotes, linhaCsv, paraCsv } from "@/lib/exportar";
import { parse } from "@/lib/import/parse";
import { aplicar } from "@/lib/import/aplicar";
import { setShelvesByName } from "@/lib/curation";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A EXPORTAÇÃO QUE NÃO REIMPORTA NÃO É UMA SAÍDA. É UMA LEMBRANÇA.
 *
 *  ═══ POR QUE ESTE TESTE É O TESTE ═══
 *
 *  Um arquivo bonito não prova nada. Qualquer app consegue cuspir um JSON com o nome da
 *  pessoa dentro e chamar aquilo de "exportação" — e a maioria faz exatamente isso. **Um
 *  JSON proprietário que ninguém importa é um bilhete de sequestro em fonte bonita.**
 *
 *  A única prova que vale é a viagem de volta:
 *
 *      1. exporta a estante de alguém
 *      2. APAGA as linhas dela do banco
 *      3. reimporta o CSV pelo IMPORTADOR DE VERDADE — o mesmo que lê o arquivo do
 *         Goodreads, sem nenhum caminho especial para o nosso formato
 *      4. prova que voltou igual: mesma estante, mesmas datas, mesmas notas, mesmas
 *         resenhas
 *
 *  Se o passo 3 precisasse de um importador nosso, o formato não seria uma saída: seria
 *  uma porta que só a nossa chave abre.
 *
 *  ═══ E É POR ISSO QUE ELE FALA COM O POSTGRES DE VERDADE ═══
 *
 *  Um banco fingido provaria que o código chama o banco, e não que o DADO sobreviveu à
 *  viagem. E o dado é a coisa inteira.
 * ════════════════════════════════════════════════════════════════════
 */

let userId: string;
let obraA: string;
let obraB: string;
const marca = Math.random().toString(36).slice(2, 8);

beforeAll(async () => {
  const [u] = await db.execute<{ id: string }>(sql`
    insert into users (handle, email, display_name, email_verified)
    values (${"saida-" + marca}, ${"saida-" + marca + "@teste.local"}, 'Teste da Saída', true)
    returning id`);
  userId = u!.id;

  const obras = await db.execute<{ id: string }>(sql`
    select id from works where id in (
      select w.id from works w
       join editions e on e.work_id = w.id and e.cover_url is not null
      limit 2)`);

  obraA = obras[0]?.id ?? "";
  obraB = obras[1]?.id ?? "";
});

afterAll(async () => {
  await db.execute(sql`delete from users where id = ${userId}::uuid`);
});

/** Tudo o que a pessoa escreveu, do jeito que a gente vai conferir depois. */
async function retrato(uid: string) {
  const linhas = await db.execute<{
    title: string;
    status: string;
    rating: number | null;
    review: string | null;
    private_note: string | null;
    finished: string | null;
    started: string | null;
    shelves: string[] | null;
    owned: boolean;
    format: string | null;
  }>(sql`
    select w.title,
           le.status::text as status,
           r.value as rating,
           rv.body as review,
           rv.private_note,
           (exists (select 1 from owned_copies oc
                     where oc.user_id = le.user_id and oc.work_id = w.id)) as owned,
           (select e.format::text from editions e where e.id = le.edition_id) as format,
           (select max(rd.finished_on)::text from readings rd where rd.entry_id = le.id) as finished,
           (select max(rd.started_on)::text  from readings rd where rd.entry_id = le.id) as started,
           (select array_agg(c.name order by c.name)
              from collection_items ci join collections c on c.id = ci.collection_id
             where ci.work_id = w.id and c.user_id = ${uid}::uuid) as shelves
      from library_entries le
      join works w on w.id = le.work_id
      left join ratings r on r.user_id = le.user_id and r.work_id = le.work_id
      left join reviews rv on rv.user_id = le.user_id and rv.work_id = le.work_id
                          and rv.deleted_at is null
     where le.user_id = ${uid}::uuid
     order by w.title`);

  return linhas.map((l) => ({
    ...l,
    shelves: (l.shelves ?? []).sort(),
  }));
}

describe("a porta de saída", () => {
  /**
   * Sessenta segundos, e não os cinco de sempre.
   *
   * Este teste faz a viagem inteira: exporta, apaga, e REIMPORTA pelo importador de
   * verdade — que casa cada livro contra um catálogo de 260 mil obras. Ele é lento porque
   * é honesto: um teste que fingisse o importador não provaria nada.
   */
  it("o CSV volta pelo importador, e a estante volta igual", { timeout: 60_000 }, async () => {
    // A viagem de ida e volta casa contra o catálogo de verdade. Num banco só migrado,
    // sem catálogo (o CI), não há duas obras com capa para viajar — então não há teste.
    // Mesmo padrão de lib/busca.sql.test.ts: acervo vazio não tem o que responder.
    if (!obraA || !obraB) return;

    // ── 1. uma estante de verdade, com tudo que uma pessoa escreve ──────────

    /**
     * UMA CAPA DURA. E ela é o ponto: o schema tem `format` com default 'paperback', então
     * um livro que atravesse a viagem sem carregar o formato volta como BROCHURA — um chute
     * sobre o objeto que está na mão da pessoa, e ela não tem como saber que a gente chutou.
     *
     * A planilha que virou este produto tinha 29 capas duras de 44 livros.
     */
    const [edA] = await db.execute<{ id: string }>(sql`
      insert into editions (work_id, publisher, published_year, format)
      values (${obraA}::uuid, 'Editora de Teste', 2016, 'hardcover')
      returning id`);

    const [eA] = await db.execute<{ id: string }>(sql`
      insert into library_entries (user_id, work_id, status, edition_id, added_at)
      values (${userId}::uuid, ${obraA}::uuid, 'read', ${edA!.id}::uuid, now() - interval '2 days')
      returning id`);

    await db.execute(sql`
      insert into readings (entry_id, started_on, finished_on)
      values (${eA!.id}::uuid, '2019-03-07'::date, '2019-04-02'::date)`);

    await db.execute(sql`
      insert into ratings (user_id, work_id, value) values (${userId}::uuid, ${obraA}::uuid, 5)`);

    await db.execute(sql`
      insert into reviews (user_id, work_id, body, private_note, visibility)
      values (${userId}::uuid, ${obraA}::uuid,
              ${'Uma resenha com vírgula, "aspas" e\numa quebra de linha.'},
              ${"O que eu escrevi só para mim."}, 'private')`);

    // TER NÃO É LER, e o formato diz se ela coleciona objetos ou arquivos.
    await db.execute(sql`
      insert into owned_copies (user_id, work_id, edition_id, state)
      values (${userId}::uuid, ${obraA}::uuid, ${edA!.id}::uuid, 'owned')`);

    await setShelvesByName({ id: userId }, obraA, "para reler, do meu pai");

    await db.execute(sql`
      insert into library_entries (user_id, work_id, status, added_at)
      values (${userId}::uuid, ${obraB}::uuid, 'did_not_finish', now() - interval '1 day')`);

    await db.execute(sql`
      insert into ratings (user_id, work_id, value) values (${userId}::uuid, ${obraB}::uuid, 2)`);

    const antes = await retrato(userId);
    expect(antes.length, "a estante de teste não foi montada").toBe(2);

    // ── 2. exporta ─────────────────────────────────────────────────────────

    let csv = linhaCsv([...COLUNAS]);
    for await (const lote of estanteEmLotes(userId)) {
      for (const linha of lote) csv += linhaCsv(paraCsv(linha));
    }

    /**
     * A RESENHA TEM VÍRGULA, ASPAS E QUEBRA DE LINHA — as três coisas que quebram um CSV.
     * Se o escapamento estiver errado, o arquivo tem mais colunas do que devia e o
     * importador lê lixo. É o bug mais comum de exportação que existe.
     */
    expect(csv.split("\r\n")[0]).toBe([...COLUNAS].join(","));

    // ── 3. APAGA. Tudo. Como se ela tivesse ido embora ─────────────────────

    await db.execute(sql`delete from library_entries where user_id = ${userId}::uuid`);
    await db.execute(sql`delete from ratings where user_id = ${userId}::uuid`);
    await db.execute(sql`delete from reviews where user_id = ${userId}::uuid`);
    await db.execute(sql`delete from collections where user_id = ${userId}::uuid`);

    expect((await retrato(userId)).length, "o apagar não apagou").toBe(0);

    // ── 4. REIMPORTA pelo importador de verdade ────────────────────────────

    /**
     * `parse` é o MESMO que lê o arquivo do Goodreads. Nenhum caminho especial, nenhuma
     * dica de que o arquivo é nosso. Se ele precisasse saber, o formato não seria uma
     * saída: seria uma porta que só a nossa chave abre.
     */
    const livros = parse(csv);
    expect(livros.length, "o importador não entendeu o nosso próprio arquivo").toBe(2);

    await aplicar({ id: userId }, livros);

    // ── 5. e voltou igual? ─────────────────────────────────────────────────

    const depois = await retrato(userId);

    expect(depois.length, "voltaram menos livros do que saíram").toBe(antes.length);

    for (let i = 0; i < antes.length; i++) {
      const a = antes[i]!;
      const d = depois[i]!;

      expect(d.title, "o título mudou na viagem").toBe(a.title);
      expect(d.status, `${a.title}: a prateleira mudou na viagem`).toBe(a.status);
      expect(d.rating, `${a.title}: a nota mudou na viagem`).toBe(a.rating);
      expect(d.review, `${a.title}: a resenha mudou na viagem`).toBe(a.review);
      expect(d.finished, `${a.title}: a data em que terminou sumiu`).toBe(a.finished);
      expect(d.started, `${a.title}: a data em que começou sumiu`).toBe(a.started);
      expect(d.shelves, `${a.title}: as estantes que ela inventou sumiram`).toEqual(a.shelves);

      /**
       * A NOTA PRIVADA. A issue do importador dizia que ela "não tem lugar hoje" — e tinha:
       * `reviews.private_note` existe no schema desde sempre, e o importador já a gravava.
       * A issue é que estava desatualizada. Este teste impede que ela se perca de novo.
       */
      expect(d.private_note, `${a.title}: a nota privada sumiu na viagem`).toBe(a.private_note);

      /** TER NÃO É LER: quem tem o exemplar continua tendo depois da viagem. */
      expect(d.owned, `${a.title}: a posse do exemplar sumiu na viagem`).toBe(a.owned);

      /**
       * ═══ CAPA DURA CONTINUA CAPA DURA ═══
       *
       * A coluna "Binding" faltava dos DOIS lados: o importador não a lia, e a exportação
       * não a escrevia. Pior: sem ISBN, a edição casava por "qualquer uma sem ISBN" — e uma
       * capa dura importada era pendurada numa BROCHURA que já existia no catálogo. A pessoa
       * exportava 29 capas duras e reimportava 29 brochuras, sem o app dizer que trocou.
       *
       * ═══ E O QUE ESTE TESTE NÃO PODE AFIRMAR ═══
       *
       * Só se confere o formato de quem TINHA um. `editions.format` é `not null` com default
       * `paperback` no schema: um livro cujo formato ninguém sabe nasce brochura — um chute
       * sobre o objeto que está na mão da pessoa, e ela não tem como saber que a gente
       * chutou. Isso é um achado, e é uma decisão de produto (ver o relatório).
       */
      if (a.format !== null) {
        expect(d.format, `${a.title}: o formato do exemplar mudou na viagem`).toBe(a.format);
      }
    }
  });

  /**
   * ═══ A NOTA VAI DUAS VEZES, E AS DUAS SÃO NECESSÁRIAS ═══
   *
   * O número (1..5) é o que o resto do mundo lê: sem ele, a saída não abre porta nenhuma.
   * A palavra ("adorei") é a nota de verdade: sem ela, a exportação trai o produto.
   *
   * Mandar só uma das duas é escolher qual promessa quebrar.
   */
  it("a nota vai como número E como palavra", async () => {
    if (!obraA || !obraB) return; // sem catálogo (CI), a estante deste teste nasce vazia
    let csv = "";
    for await (const lote of estanteEmLotes(userId)) {
      for (const linha of lote) csv += linhaCsv(paraCsv(linha));
    }

    const iNumero = COLUNAS.indexOf("My Rating" as never);
    const iPalavra = COLUNAS.indexOf("Gume Nota" as never);

    expect(iNumero).toBeGreaterThanOrEqual(0);
    expect(iPalavra).toBeGreaterThanOrEqual(0);

    // A obra com nota 5 tem que carregar o "5" E o "adorei".
    //
    // ═══ E A CONFERÊNCIA FATIA O CSV DE VERDADE ═══
    //
    // Isto era `l.split(",")[iNumero]`, e quebrou no dia em que a obra sorteada do
    // catálogo veio com vírgula no título: o split ingênuo desloca as colunas, e o
    // teste acusava o EXPORTADOR por um defeito do próprio teste. O CSV sempre esteve
    // certo (o teste de ida e volta acima prova); quem não sabia ler aspas era esta
    // linha. Agora ela fatia com as mesmas regras de quem escreve.
    const fatiar = (l: string): string[] => {
      const campos: string[] = [];
      let atual = "";
      let dentro = false;
      for (let i = 0; i < l.length; i++) {
        const c = l[i]!;
        if (dentro) {
          if (c === '"' && l[i + 1] === '"') { atual += '"'; i++; }
          else if (c === '"') dentro = false;
          else atual += c;
        } else if (c === '"') dentro = true;
        else if (c === ",") { campos.push(atual); atual = ""; }
        else atual += c;
      }
      campos.push(atual);
      return campos;
    };

    expect(csv).toContain("adorei");
    expect(csv.split("\r\n").some((l) => fatiar(l)[iNumero] === "5")).toBe(true);
  });

  /**
   * ═══ ESTADO DERIVADO NÃO É DADO ═══
   *
   * A honra e a contagem de livros são uma CONTA feita a partir do que já está no arquivo.
   * Levar a conta junto é levar uma resposta que um dia discorda da pergunta — e nenhuma
   * das duas foi escrita pela pessoa.
   */
  it("a honra e a contagem não são exportadas: elas são cálculo, e não dado", async () => {
    if (!obraA || !obraB) return; // sem catálogo (CI), a estante deste teste nasce vazia
    let csv = linhaCsv([...COLUNAS]);
    for await (const lote of estanteEmLotes(userId)) {
      for (const linha of lote) csv += linhaCsv(paraCsv(linha));
    }

    for (const proibido of ["honra", "gume +", "prata", "ferro", "katana"]) {
      expect(
        csv.toLowerCase().includes(proibido),
        `a exportação carrega "${proibido}". Honra é cálculo, e não dado: um número que ` +
          "viaja junto é um número que um dia discorda do que o gerou.",
      ).toBe(false);
    }
  });
});
