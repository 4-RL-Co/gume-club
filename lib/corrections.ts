import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertAuthenticated, assertLibrarian, Forbidden, type Viewer } from "@/lib/authz";
import { LIMITS, clamp } from "@/lib/limits";
import { porQueNaoAceita } from "@/lib/imagens";
import { editions, authors, revisions, coverProposals, users } from "@/lib/db/schema";
import { ehBibliotecario } from "@/lib/librarian";
import {
  CAMPOS, CAMPOS_AUTOR, type Campo, type CampoAutor, type Correcao, type Proposta,
} from "@/lib/corrections-view";

export { CAMPOS, CAMPOS_AUTOR, type Campo, type CampoAutor, type Correcao, type Proposta };

/**
 * ════════════════════════════════════════════════════════════════════
 *  O HISTÓRICO DE CORREÇÕES. É a fundação de tudo que vem depois.
 *
 *  Nada é sobrescrito em silêncio. Toda correção grava uma revisão com
 *  o nome de quem fez, e o histórico é PÚBLICO. É isso, e não uma
 *  permissão, que torna o vandalismo caro: o nome fica, para sempre.
 *
 *  Reverter é ação de bibliotecário, e a reversão TAMBÉM entra no log.
 *
 *  A CAPA é a única exceção à correção livre, porque é o único campo que
 *  aparece na tela de todo mundo: é onde o vandalismo tem plateia. Nela,
 *  o leitor propõe e o bibliotecário aplica.
 * ════════════════════════════════════════════════════════════════════
 */

/** As correções desta obra e das edições dela. Pública, com nome, para sempre. */
export async function getCorrecoes(targetIds: string[]): Promise<Correcao[]> {
  if (targetIds.length === 0) return [];

  const rows = await db.execute<{
    id: string; patch: Record<string, unknown>; previous: Record<string, unknown>;
    handle: string | null; name: string | null; image: string | null;
    librarian_tier: number | null;
    created_at: Date; reverted_at: Date | null; revertedby: string | null;
  }>(sql`
    select r.id, r.patch, r.previous, r.created_at, r.reverted_at,
           u.handle, u.display_name as name, u.image, u.librarian_tier,
           (select u2.handle from users u2 where u2.id = r.reverted_by) as revertedby
      from revisions r
      left join users u on u.id = r.user_id
     where r.target_id = any(${sql.param(targetIds)}::uuid[])
     order by r.created_at desc
     limit 40`);

  const out: Correcao[] = [];

  for (const r of rows) {
    // Uma revisão pode tocar mais de um campo. Cada campo vira uma linha na tela,
    // porque é assim que a pessoa lê: "corrigiu as páginas", não "corrigiu 3 campos".
    for (const [campo, para] of Object.entries(r.patch ?? {})) {
      out.push({
        id: `${r.id}:${campo}`,
        campo: rotulo(campo),
        de: mostra(r.previous?.[campo]),
        para: mostra(para),
        handle: r.handle,
        name: r.name,
        image: r.image,
        librarian: (r.librarian_tier ?? 0) > 0,
        createdAt: r.created_at,
        revertedAt: r.reverted_at,
        revertedByHandle: r.revertedby,
      });
    }
  }

  return out;
}

function rotulo(campo: string): string {
  const conhecidos: Record<string, string> = {
    ...Object.fromEntries(Object.entries(CAMPOS).map(([k, v]) => [k, v.label])),
    coverUrl: "capa",
    title: "título",
    authorId: "autor",
    firstPublished: "ano da obra",
  };
  return conhecidos[campo] ?? campo;
}

function mostra(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "string" && v.startsWith("http")) return "uma imagem";
  return String(v);
}

/**
 * Corrigir um dado desta edição. Qualquer leitor logado, e aplica na hora.
 *
 * A allow-list é o objeto CAMPOS, e ela é explícita: o que não está lá não entra,
 * venha o campo que vier no corpo da requisição. A capa NÃO está lá de propósito.
 */
export async function corrigirEdicao(
  viewer: Viewer,
  editionId: string,
  campo: Campo,
  valor: string,
  motivo: string | null,
): Promise<void> {
  assertAuthenticated(viewer);

  if (!(campo in CAMPOS)) throw new Forbidden("campo não é corrigível");

  const [edicao] = await db.select().from(editions).where(eq(editions.id, editionId)).limit(1);
  if (!edicao) throw new Error("edição não encontrada");

  const antes = (edicao as Record<string, unknown>)[campo] ?? null;

  const limpo =
    CAMPOS[campo].tipo === "numero"
      ? (() => {
          const n = Number(String(valor).trim());
          return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
        })()
      : clamp(valor, LIMITS.publisher);

  if (limpo === antes) return; // nada mudou: nada vira revisão

  await db.transaction(async (tx) => {
    await tx.update(editions).set({ [campo]: limpo }).where(eq(editions.id, editionId));

    await tx.insert(revisions).values({
      userId: viewer.id,
      targetType: "edition",
      targetId: editionId,
      patch: { [campo]: limpo },
      previous: { [campo]: antes },
      reason: clamp(motivo, LIMITS.note),
    });
  });
}

/**
 * Reverter. Só bibliotecário, e a reversão TAMBÉM entra no log.
 *
 * Ela não apaga a revisão original: marca-a como revertida, e grava uma revisão
 * nova que desfaz o que a primeira fez. O histórico é append-only, e um histórico
 * que se apaga não é histórico: é uma versão dos fatos.
 */
export async function reverter(viewer: Viewer, revisionId: string): Promise<void> {
  /**
   * O PODER passa pela MESMA regra que dá a insígnia. Ver lib/librarian.ts.
   *
   * Antes isto olhava só o `librarian_tier`, e o tier só se muda à mão, no banco.
   * Com o bibliotecário automático, quem cruzasse a barra teria a INSÍGNIA e não
   * teria o PODER: exibiria "bibliotecário" no perfil e a fila responderia "você não
   * pode". Duas regras para a mesma coisa sempre divergem.
   *
   * O tier continua valendo, e continua sendo a porta manual: ele está DENTRO da
   * regra, e não ao lado dela.
   */
  const [eu] = viewer
    ? await db.execute<{ sim: boolean }>(sql`
        select ${ehBibliotecario(sql`u`)} as sim
          from users u where u.id = ${viewer.id}::uuid and u.deleted_at is null`)
    : [];
  assertLibrarian(viewer, eu?.sim ? 1 : 0);

  const [rev] = await db
    .select()
    .from(revisions)
    .where(and(eq(revisions.id, revisionId), sql`${revisions.revertedAt} is null`))
    .limit(1);
  if (!rev) throw new Error("essa correção não existe ou já foi revertida");

  const anterior = rev.previous as Record<string, unknown>;
  const atual = rev.patch as Record<string, unknown>;

  await db.transaction(async (tx) => {
    if (rev.targetType === "edition") {
      await tx.update(editions).set(anterior).where(eq(editions.id, rev.targetId));
    }

    const [desfazer] = await tx
      .insert(revisions)
      .values({
        userId: viewer.id,
        targetType: rev.targetType,
        targetId: rev.targetId,
        patch: anterior,
        previous: atual,
        reason: "reversão",
      })
      .returning({ id: revisions.id });

    await tx
      .update(revisions)
      .set({ revertedAt: new Date(), revertedBy: viewer.id, revertedIn: desfazer!.id })
      .where(eq(revisions.id, revisionId));
  });
}

// ─────────────────────────────────────────────────────────── a capa

/**
 * Propor uma capa. Qualquer leitor logado propõe; só bibliotecário aplica.
 *
 * Por REFERÊNCIA: a URL da fonte, e nunca uma cópia do arquivo.
 */
export async function proporCapa(
  viewer: Viewer,
  editionId: string,
  url: string,
  nota: string | null,
): Promise<void> {
  assertAuthenticated(viewer);

  const limpo = clamp(url, LIMITS.url);
  if (!limpo) throw new Error("o endereço da capa está vazio");

  /**
   * ═══ A MESMA CONFERÊNCIA DO RETRATO, PELO MESMO MOTIVO ═══
   *
   * Antes, qualquer host passava — e a CSP bloqueava na hora de MOSTRAR. O estrago aqui
   * é maior que no retrato: a proposta entrava na fila, um bibliotecário a aprovava
   * olhando a prévia... que também não carregava. Uma capa quebrada na tela de todo mundo,
   * aprovada por alguém que não tinha como ver que estava quebrada.
   */
  const naoAceita = porQueNaoAceita(limpo);
  if (naoAceita) throw new Error(naoAceita);

  await db
    .insert(coverProposals)
    .values({ editionId, userId: viewer.id, coverUrl: limpo, note: clamp(nota, LIMITS.note) })
    .onConflictDoNothing();
}

/** A fila. Só bibliotecário vê. */
export async function getFilaDeCapas(viewer: Viewer): Promise<Proposta[]> {
  /**
   * O PODER passa pela MESMA regra que dá a insígnia. Ver lib/librarian.ts.
   *
   * Antes isto olhava só o `librarian_tier`, e o tier só se muda à mão, no banco.
   * Com o bibliotecário automático, quem cruzasse a barra teria a INSÍGNIA e não
   * teria o PODER: exibiria "bibliotecário" no perfil e a fila responderia "você não
   * pode". Duas regras para a mesma coisa sempre divergem.
   *
   * O tier continua valendo, e continua sendo a porta manual: ele está DENTRO da
   * regra, e não ao lado dela.
   */
  const [eu] = viewer
    ? await db.execute<{ sim: boolean }>(sql`
        select ${ehBibliotecario(sql`u`)} as sim
          from users u where u.id = ${viewer.id}::uuid and u.deleted_at is null`)
    : [];
  assertLibrarian(viewer, eu?.sim ? 1 : 0);

  const rows = await db.execute<{
    id: string; cover_url: string; note: string | null; created_at: Date;
    handle: string | null; name: string | null;
    work_title: string; work_slug: string; atual: string | null;
  }>(sql`
    select p.id, p.cover_url, p.note, p.created_at,
           u.handle, u.display_name as name,
           w.title as work_title, w.slug as work_slug,
           e.cover_url as atual
      from cover_proposals p
      join editions e on e.id = p.edition_id
      join works w on w.id = e.work_id
      left join users u on u.id = p.user_id
     where p.state = 'pending'
     order by p.created_at asc
     limit 50`);

  return rows.map((r) => ({
    id: r.id,
    coverUrl: r.cover_url,
    note: r.note,
    createdAt: r.created_at,
    handle: r.handle,
    name: r.name,
    workTitle: r.work_title,
    workSlug: r.work_slug,
    atual: r.atual,
  }));
}

/** Aplicar ou recusar. Só bibliotecário. Aplicar grava revisão com o nome de QUEM PROPÔS. */
export async function julgarCapa(
  viewer: Viewer,
  propostaId: string,
  aplicar: boolean,
): Promise<void> {
  /**
   * O PODER passa pela MESMA regra que dá a insígnia. Ver lib/librarian.ts.
   *
   * Antes isto olhava só o `librarian_tier`, e o tier só se muda à mão, no banco.
   * Com o bibliotecário automático, quem cruzasse a barra teria a INSÍGNIA e não
   * teria o PODER: exibiria "bibliotecário" no perfil e a fila responderia "você não
   * pode". Duas regras para a mesma coisa sempre divergem.
   *
   * O tier continua valendo, e continua sendo a porta manual: ele está DENTRO da
   * regra, e não ao lado dela.
   */
  const [eu] = viewer
    ? await db.execute<{ sim: boolean }>(sql`
        select ${ehBibliotecario(sql`u`)} as sim
          from users u where u.id = ${viewer.id}::uuid and u.deleted_at is null`)
    : [];
  assertLibrarian(viewer, eu?.sim ? 1 : 0);

  const [p] = await db
    .select()
    .from(coverProposals)
    .where(and(eq(coverProposals.id, propostaId), eq(coverProposals.state, "pending")))
    .limit(1);
  if (!p) throw new Error("essa proposta não existe ou já foi julgada");

  await db.transaction(async (tx) => {
    if (aplicar) {
      const [edicao] = await tx
        .select({ coverUrl: editions.coverUrl })
        .from(editions)
        .where(eq(editions.id, p.editionId))
        .limit(1);

      await tx.update(editions).set({ coverUrl: p.coverUrl }).where(eq(editions.id, p.editionId));

      // A revisão leva o nome de QUEM PROPÔS, e não do bibliotecário que apertou o
      // botão: o trabalho é de quem achou a capa. O bibliotecário aparece no
      // julgamento, e não na autoria.
      await tx.insert(revisions).values({
        userId: p.userId,
        targetType: "edition",
        targetId: p.editionId,
        patch: { coverUrl: p.coverUrl },
        previous: { coverUrl: edicao?.coverUrl ?? null },
        reason: p.note,
      });
    }

    await tx
      .update(coverProposals)
      .set({
        state: aplicar ? "applied" : "refused",
        reviewedBy: viewer.id,
        reviewedAt: new Date(),
      })
      .where(eq(coverProposals.id, propostaId));
  });
}

/** Sou bibliotecário? Usado pela tela para decidir o que mostrar. */
export async function souBibliotecario(viewer: Viewer): Promise<boolean> {
  if (!viewer) return false;

  /**
   * A MESMA regra que dá a insígnia, e não uma segunda cópia dela.
   *
   * Bibliotecário é insígnia E poder ao mesmo tempo. Com duas regras separadas elas
   * divergem, e o modo de falha é humilhante: a pessoa exibe a insígnia no perfil e
   * a fila de capas responde "você não pode". Ver lib/librarian.ts.
   */
  const [eu] = await db.execute<{ sim: boolean }>(sql`
    select ${ehBibliotecario(sql`u`)} as sim
      from users u
     where u.id = ${viewer.id}::uuid and u.deleted_at is null`);

  return eu?.sim ?? false;
}


/**
 * ════════════════════════════════════════════════════════════════════
 *  CORRIGIR UM AUTOR. O mesmo histórico, e nunca um segundo.
 *
 *  O nome do autor vem do dump da Open Library escrito de qualquer jeito
 *  ("Machado De ASSIS"), a nacionalidade está quase toda vazia, e não
 *  havia como um leitor arrumar nada disso. A edição era corrigível
 *  desde a fatia 1; o autor, não, e não havia motivo.
 *
 *  Grava na MESMA tabela `revisions`, com `target_type = 'author'`. Um
 *  segundo histórico, paralelo, seria uma segunda verdade sobre quem
 *  mudou o quê — e a página de contribuidores conta as duas juntas,
 *  porque consertar o nome de um autor é o mesmo trabalho que consertar
 *  o ano de uma edição.
 *
 *  O NOME é corrigível, e o SLUG não muda junto. Isso é deliberado: o
 *  slug é o endereço público do autor, e alguém já guardou o link. Um
 *  acento consertado no nome não pode quebrar um link que existe.
 * ════════════════════════════════════════════════════════════════════
 */
export async function corrigirAutor(
  viewer: Viewer,
  authorId: string,
  campo: CampoAutor,
  valor: string,
  motivo: string | null,
): Promise<void> {
  assertAuthenticated(viewer);

  if (!(campo in CAMPOS_AUTOR)) throw new Forbidden("campo não é corrigível");

  const [autor] = await db.select().from(authors).where(eq(authors.id, authorId)).limit(1);
  if (!autor) throw new Error("autor não encontrado");

  const antes = (autor as Record<string, unknown>)[campo] ?? null;

  // A bio é o texto mais longo de um autor, e mesmo ela tem fim. O nome, não: um
  // nome de duzentos caracteres é lixo, e lixo no catálogo é de todo mundo.
  //
  // O `clamp` continua aqui, e continua cortando: ele é a defesa contra um POST direto,
  // que não passa por formulário nenhum. Quem TRAVA antes é a tela (components/campo.tsx),
  // para que ninguém cole um texto e descubra o corte depois. As duas coisas existem, e
  // não são a mesma: uma protege o banco, a outra protege a pessoa.
  const teto = campo === "bio" ? LIMITS.authorBio : LIMITS.author;
  const limpo = clamp(valor, teto);

  if (limpo === antes) return; // nada mudou: nada vira revisão

  await db.transaction(async (tx) => {
    await tx.update(authors).set({ [campo]: limpo }).where(eq(authors.id, authorId));

    await tx.insert(revisions).values({
      userId: viewer.id,
      targetType: "author",
      targetId: authorId,
      patch: { [campo]: limpo },
      previous: { [campo]: antes },
      reason: clamp(motivo, LIMITS.note),
    });
  });
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  O RETRATO DO AUTOR. Só BIBLIOTECÁRIO, e é a mesma regra da capa.
 *
 *  Não é gosto: imagem é o único campo que aparece na tela de TODO
 *  MUNDO, e é o único onde o vandalismo tem plateia. Texto qualquer
 *  leitor corrige e aplica na hora (o nome dele fica gravado, e é isso
 *  que torna o vandalismo caro). Imagem, não.
 *
 *  Por REFERÊNCIA, sempre: a URL da fonte, e nunca uma cópia do arquivo.
 *  A imagem mora na fonte, e a gente guarda o endereço. Baixar seria
 *  copiar o acervo de outra pessoa para dentro do nosso.
 *
 *  ═══ O QUE FALTA AQUI, E ESTÁ DITO EM VOZ ALTA ═══
 *
 *  A CAPA tem uma FILA: o leitor propõe, o bibliotecário aprova, e o
 *  crédito fica com quem achou. O RETRATO não tem, e por um motivo
 *  bobo: `cover_proposals.edition_id` é NOT NULL, e a fila não sabe
 *  guardar a proposta de um autor.
 *
 *  Fazer isso direito é uma migration (edition_id anulável, author_id
 *  novo, e um check de que exatamente um dos dois está preenchido) mais
 *  a tela da fila. Está anotado em docs/O-QUE-FALTA-NO-CODIGO.md.
 *
 *  Uma fila pela metade seria pior que nenhuma: o leitor propõe, a
 *  proposta cai num buraco, e ele nunca mais contribui.
 * ════════════════════════════════════════════════════════════════════
 */
export async function corrigirRetrato(
  viewer: Viewer,
  authorId: string,
  url: string,
  motivo: string | null,
): Promise<void> {
  assertAuthenticated(viewer);

  // O tier vem do BANCO, e nunca do cliente: "sou bibliotecário" não é uma coisa que
  // o navegador tenha o direito de afirmar.
  const [eu] = await db
    .select({ tier: users.librarianTier })
    .from(users)
    .where(eq(users.id, viewer.id));
  assertLibrarian(viewer, eu?.tier ?? 0);

  const limpo = clamp(url, LIMITS.url);

  /**
   * ═══ A ORIGEM É CONFERIDA AQUI, E NÃO NO NAVEGADOR ═══
   *
   * Antes, um endereço de qualquer host era aceito, gravado, e virava revisão assinada
   * — e aí a CSP o bloqueava na hora de mostrar. O resultado: uma imagem quebrada na
   * página do autor, para todo mundo, e ninguém sabendo por quê. O bibliotecário tinha
   * feito tudo certo e o app fingiu que deu certo.
   *
   * Agora a recusa acontece antes de gravar, e ela DIZ de onde o app aceita imagem.
   */
  const naoAceita = limpo ? porQueNaoAceita(limpo) : null;
  if (naoAceita) throw new Error(naoAceita);

  const [autor] = await db.select().from(authors).where(eq(authors.id, authorId)).limit(1);
  if (!autor) throw new Error("autor não encontrado");
  if (limpo === (autor.imageUrl ?? null)) return;

  await db.transaction(async (tx) => {
    await tx.update(authors).set({ imageUrl: limpo }).where(eq(authors.id, authorId));

    // Entra no MESMO histórico. Um bibliotecário não é uma exceção ao registro: ele
    // é uma exceção à espera. O nome dele fica, como o de todo mundo.
    await tx.insert(revisions).values({
      userId: viewer.id,
      targetType: "author",
      targetId: authorId,
      patch: { imageUrl: limpo },
      previous: { imageUrl: autor.imageUrl ?? null },
      reason: clamp(motivo, LIMITS.note),
    });
  });
}

// ───────────────────────────────────────────────── dois autores, uma pessoa

/**
 * ════════════════════════════════════════════════════════════════════
 *  DOIS AUTORES QUE SÃO A MESMA PESSOA.
 *
 *  ═══ A ARMADILHA QUE ISTO DESARMA ═══
 *
 *  `authors.name` é único, e o índice diferencia maiúscula e acento. O dump guarda a
 *  mesma pessoa várias vezes: "Oswaldo França Júnior", "Oswaldo Franca Junior",
 *  "Oswaldo Franc̦a Júnior" — seis linhas, um homem só. São **7.887 nomes** assim.
 *
 *  E o motivo número um para alguém querer arrumar um nome é justamente normalizar um
 *  desses. Era exatamente aí que o app estourava: renomear para a forma certa colide
 *  com a linha que JÁ tem a forma certa, o unique recusa, e a tela dizia "não deu para
 *  arrumar agora" — uma mentira genérica em cima de um fato específico, que nem quem
 *  escreveu o código conseguia diagnosticar.
 *
 *  A saída não é afrouxar o unique: é entender o que a pessoa está dizendo. Arrumar o
 *  nome de um duplicado não é RENOMEAR, é dizer **"estes dois são a mesma pessoa"**.
 *  Então o app pergunta, e funde.
 * ════════════════════════════════════════════════════════════════════
 */
export type Homonimo = {
  id: string;
  name: string;
  /** Quantos livros ele carrega: é o que a pergunta mostra ("com 12 livros"). */
  livros: number;
  /**
   * Os dois têm o MESMO livro (título exato, mesmo volume)?
   *
   * Aí a fusão não pode acontecer: `works` tem unique em (title, author_id, volume), e
   * juntar faria duas linhas idênticas caírem no mesmo autor. Consertar isso é fundir
   * as OBRAS também, e isso mexe na estante, na nota e na resenha de gente de verdade.
   * É outra fatia, e ela não sai de véspera. São 793 dos 7.887.
   */
  colide: boolean;
};

/** Já existe alguém com esse nome? É a pergunta que o formulário faz antes de gravar. */
export async function homonimoDe(nome: string, exceto: string): Promise<Homonimo | null> {
  const limpo = clamp(nome, LIMITS.author);
  if (!limpo) return null;

  const [row] = await db.execute<Homonimo>(sql`
    select a.id, a.name,
           (select count(*) from works w where w.author_id = a.id)::int as livros,
           exists (
             select 1
               from works meu
               join works dele on dele.title = meu.title
                              and coalesce(dele.volume, -1) = coalesce(meu.volume, -1)
              where meu.author_id = ${exceto}::uuid
                and dele.author_id = a.id
           ) as colide
      from authors a
     where a.name = ${limpo}
       and a.id <> ${exceto}::uuid
     limit 1`);

  return row ?? null;
}

/**
 * Juntar dois autores: os livros do `de` passam para o `para`, o nome do `de` vira
 * apelido, e a linha duplicada sai.
 *
 * Não pede permissão, como toda correção: a revisão fica gravada com o nome de quem
 * fez, e é a assinatura — e não a permissão — que torna o vandalismo caro.
 */
export async function fundirAutores(
  viewer: Viewer,
  deId: string,
  paraId: string,
  motivo: string | null,
): Promise<void> {
  assertAuthenticated(viewer);
  if (deId === paraId) return;

  const [de] = await db.select().from(authors).where(eq(authors.id, deId)).limit(1);
  const [para] = await db.select().from(authors).where(eq(authors.id, paraId)).limit(1);
  if (!de || !para) throw new Error("autor não encontrado");

  await db.transaction(async (tx) => {
    /**
     * A COLISÃO É CONFERIDA AQUI DENTRO, e não só na tela.
     *
     * A tela pergunta antes para poder explicar; esta checagem existe porque entre a
     * pergunta e o clique cabe um livro novo, e porque um POST direto não passa por
     * tela nenhuma. Sem ela, o unique de `works` estouraria no meio da transação e a
     * pessoa levaria de novo o "não deu para arrumar" que este código veio matar.
     */
    const [choque] = await tx.execute<{ existe: boolean }>(sql`
      select exists (
        select 1
          from works a
          join works b on b.title = a.title and coalesce(b.volume, -1) = coalesce(a.volume, -1)
         where a.author_id = ${deId}::uuid and b.author_id = ${paraId}::uuid
      ) as existe`);

    if (choque?.existe) {
      throw new Forbidden("os dois têm o mesmo livro: fundir os autores exige fundir as obras");
    }

    /**
     * Os livros mudam de dono ANTES de a linha sair.
     *
     * `works.author_id` é `on delete set null`: apagar primeiro deixaria os livros
     * órfãos, sem autor, e em silêncio — o pior jeito possível de perder um dado.
     */
    await tx.execute(sql`update works  set author_id      = ${paraId}::uuid where author_id      = ${deId}::uuid`);
    await tx.execute(sql`update series set author_id      = ${paraId}::uuid where author_id      = ${deId}::uuid`);
    await tx.execute(sql`update series set illustrator_id = ${paraId}::uuid where illustrator_id = ${deId}::uuid`);

    /**
     * O nome que sai não se perde: vira APELIDO do sobrevivente.
     *
     * Apelido é buscável (ver lib/catalog.ts): quem procurar por "Oswaldo Franca
     * Junior", escrito errado como estava no dump, continua achando o homem. Fundir não
     * pode custar a busca de ninguém.
     */
    await tx.execute(sql`
      update authors p
         set alt_names = (
           select array(
             select distinct x
               from unnest(
                 coalesce(p.alt_names, '{}'::text[])
                 || coalesce(d.alt_names, '{}'::text[])
                 || array[d.name]
               ) as x
              where x is not null and x <> '' and x <> p.name
           ))
        from authors d
       where p.id = ${paraId}::uuid and d.id = ${deId}::uuid`);

    await tx.insert(revisions).values({
      userId: viewer.id,
      targetType: "author",
      targetId: paraId,
      patch: { fundidoCom: de.name, livrosMovidos: true },
      previous: { name: para.name },
      reason: motivo,
    });

    await tx.delete(authors).where(eq(authors.id, deId));
  });
}
