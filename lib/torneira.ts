import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertAuthenticated, Forbidden, type Viewer } from "@/lib/authz";
import { ehBibliotecario } from "@/lib/librarian";
import { ehModerador } from "@/lib/moderacao";
import { LIMITS, clamp } from "@/lib/limits";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A TORNEIRA. A busca vazia vira a lista de compras do catálogo.
 *
 *  O catálogo agora é CURADO: 300 autores escolhidos a mão. Isso só é
 *  honesto se existir um jeito de ele crescer POR DEMANDA — senão
 *  "curado" é um nome bonito para "faltando", e o leitor que procura o
 *  livro dele e não acha vai embora sem dizer nada.
 *
 *  Então o "não achei" para de ser um beco. Ele fica registrado, e vira a
 *  fila de qual autor importar em seguida. É a informação mais valiosa que
 *  um leitor pode dar de graça, e até hoje a gente jogava no lixo.
 *
 *  ═══ NÃO GUARDA QUEM PROCUROU ═══
 *
 *  A tabela não tem `user_id`, e a falta dele é a decisão. Para escolher o
 *  próximo autor basta saber O QUE pediram e QUANTAS VEZES; saber QUEM
 *  pediu não muda a escolha, e cria de graça um histórico de busca por
 *  pessoa — a coisa que ninguém pediu e que todo mundo odeia descobrir que
 *  existe. Uma coluna que não existe não vaza.
 *
 *  ═══ E NÃO É UM RANKING ═══
 *
 *  O contador serve para o bibliotecário ordenar o trabalho DELE. Ele não
 *  aparece em tela de leitor, não ordena busca, e não vira "mais
 *  procurados". A fila é ferramenta de quem trabalha; não é vitrine.
 * ════════════════════════════════════════════════════════════════════
 */

/** O mesmo pedido escrito de três jeitos é UM pedido. Sem isso a fila vira ruído. */
function canonico(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * REGISTRAR UM "NÃO ACHEI".
 *
 * Só a busca DELIBERADA conta — a que foi até a Open Library e ao Google e voltou
 * de mãos vazias. A busca-enquanto-digita não conta: "t", "to", "tol" voltam vazias
 * três vezes no caminho de "tolstoi", e a fila encheria de pedaços de palavra.
 *
 * Nunca levanta. Um erro ao anotar um pedido não pode derrubar a busca de ninguém:
 * a pessoa está tentando achar um livro, e o nosso caderninho é problema nosso.
 */
export async function registrarBuscaVazia(texto: string): Promise<void> {
  const limpo = clamp(texto, LIMITS.title);
  if (!limpo) return;

  const chave = canonico(limpo);
  // Curto demais para ser um pedido. "de", "o", "um" não são livros.
  if (chave.length < 3) return;

  try {
    await db.execute(sql`
      insert into buscas_vazias (texto, canonico)
      values (${limpo}, ${chave})
      on conflict (canonico) do update
         set quantas = buscas_vazias.quantas + 1,
             ultima_em = now(),
             -- Voltou a ser pedido depois de atendido? Então não foi atendido: o
             -- livro que a gente importou não era o que a pessoa queria.
             atendida_em = null,
             atendida_por = null
       where buscas_vazias.canonico = ${chave}`);
  } catch {
    // De propósito. Ver o cabeçalho da função.
  }
}

export type Pedido = {
  id: string;
  texto: string;
  quantas: number;
  desde: Date;
  ultima: Date;
};

/**
 * Quem vê a fila: BIBLIOTECÁRIO ou MODERADOR.
 *
 * Bibliotecário porque a fila é trabalho de catálogo, e é ele quem mexe em ficha de
 * livro. Moderador porque ele também precisa enxergar o que está sendo digitado no
 * app — uma fila de busca é, sem querer, um lugar onde spam e abuso aparecem.
 *
 * Leitor comum não vê. Não por segredo: porque "os livros que o Gume não tem" é uma
 * lista que não ajuda ninguém a ler, e a única coisa que ela faria numa tela pública
 * é parecer uma lista de mais procurados. Que é exatamente o que ela não é.
 */
async function assertPodeVerAFila(viewer: Viewer): Promise<{ id: string }> {
  assertAuthenticated(viewer);

  const [eu] = await db.execute<{ pode: boolean }>(sql`
    select (${ehBibliotecario(sql`u`)} or ${ehModerador(sql`u`)}) as pode
      from users u
     where u.id = ${viewer.id}::uuid`);

  if (!eu?.pode) throw new Forbidden("a fila de pedidos é de quem cuida do catálogo");
  return viewer;
}

/** A fila: o mais pedido primeiro, e só o que ainda não foi atendido. */
export async function getFila(viewer: Viewer, limite = 100): Promise<Pedido[]> {
  await assertPodeVerAFila(viewer);

  const rows = await db.execute<{
    id: string; texto: string; quantas: number; primeira_em: Date; ultima_em: Date;
  }>(sql`
    select id, texto, quantas, primeira_em, ultima_em
      from buscas_vazias
     where atendida_em is null
     order by quantas desc, ultima_em desc
     limit ${limite}`);

  return rows.map((r) => ({
    id: r.id,
    texto: r.texto,
    quantas: Number(r.quantas),
    desde: new Date(r.primeira_em),
    ultima: new Date(r.ultima_em),
  }));
}

/**
 * Fechar um pedido: o livro entrou, o autor foi importado.
 *
 * É uma DATA, e não um delete. A fila atendida é a prova de que a torneira funciona,
 * e apagá-la seria apagar a única memória de como o catálogo cresceu.
 */
export async function atender(viewer: Viewer, id: string): Promise<void> {
  const eu = await assertPodeVerAFila(viewer);

  await db.execute(sql`
    update buscas_vazias
       set atendida_em = now(), atendida_por = ${eu.id}::uuid
     where id = ${id}::uuid and atendida_em is null`);
}

/** Voltar atrás. Fechar o pedido errado é um clique, e desfazer tem que ser outro. */
export async function reabrir(viewer: Viewer, id: string): Promise<void> {
  await assertPodeVerAFila(viewer);

  await db.execute(sql`
    update buscas_vazias
       set atendida_em = null, atendida_por = null
     where id = ${id}::uuid`);
}

/** A barra lateral precisa saber se desenha o link. Esconder não protege — quem protege é o servidor. */
export async function podeVerAFila(viewer: Viewer): Promise<boolean> {
  if (!viewer) return false;
  try {
    await assertPodeVerAFila(viewer);
    return true;
  } catch {
    return false;
  }
}

/**
 * O bibliotecário precisa saber se vale a pena abrir a fila. Um badge com zero é um
 * badge que ensina a ignorar o badge.
 */
export async function quantosPedidosAbertos(viewer: Viewer): Promise<number> {
  if (!viewer) return 0;

  try {
    await assertPodeVerAFila(viewer);
  } catch {
    return 0;
  }

  const [r] = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from buscas_vazias where atendida_em is null`);

  return Number(r?.n ?? 0);
}
