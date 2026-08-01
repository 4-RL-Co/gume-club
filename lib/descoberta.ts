import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM PODE SER DESCOBERTO. Uma regra, e ela mora aqui.
 *
 *  ═══ O QUE ISTO CONSERTA ═══
 *
 *  A regra era `u.email_verified = true`, escrita à mão em QUATRO consultas
 *  (explorar, duas de listas, e o "pessoas"). Quem entra por Google ou GitHub ganha
 *  a verificação de graça — o provedor confirma. Quem entra por e-mail e senha
 *  precisa clicar num link, e em produção **quatro dos sete nunca clicaram**.
 *
 *  Um deles tinha montado a MAIOR ESTANTE DO SITE: 503 livros, 278 deles públicos e
 *  com capa. Ele estava fora do explorar, fora das listas, fora do "pessoas", e
 *  fora dos buscadores — e **nenhuma tela do app dizia isso a ele**. Não via erro,
 *  não via aviso: simplesmente não existia para os outros, sem ter como saber.
 *
 *  Era uma cidadania de segunda invisível, e o dono descobriu pelo lado de fora
 *  ("tem gente com estante que não aparece"), que é o único lado de onde dá para ver.
 *
 *  ═══ POR QUE O PORTÃO CONTINUA EXISTINDO ═══
 *
 *  A resposta preguiçosa seria tirar o filtro. A nota original tem razão: com
 *  cadastro aberto, o explorar é a vitrine, e uma vitrine sem portão vira fazenda de
 *  spam. Tirar resolve hoje e apodrece a tela no dia em que o cadastro abrir.
 *
 *  ═══ A ESTANTE TAMBÉM É PROVA ═══
 *
 *  O e-mail verificado prova que existe uma caixa de entrada. Uma estante pública com
 *  vinte livros COM CAPA prova outra coisa, e mais cara: alguém sentou e montou.
 *  Spam não faz isso — o custo de forjar vinte livros de verdade é muito maior que o
 *  de clicar num link, e o resultado ainda seria uma estante que alguém pode olhar.
 *
 *  Os dois caminhos provam "tem gente aqui". Exigir só o primeiro era confundir o
 *  MEIO com o FIM.
 *
 *  Contra os dados reais de produção o corte separa bem: o leitor dos 503 livros
 *  entra; os dois cadastros com dois livros cada continuam fora, e é isso mesmo —
 *  dois livros não distinguem uma pessoa de um ruído.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Quantos livros públicos COM CAPA valem por uma verificação de e-mail.
 *
 * Alto de propósito. Baixo demais e vira o caminho fácil para quem quer aparecer sem
 * provar nada; e o número tem que doer para quem forja, não para quem lê.
 */
export const LIVROS_QUE_PROVAM = 20;

/**
 * O usuário está sob o alias `u` em todas as quatro consultas que usam isto. Não é
 * elegante, e é o contrato: uma expressão SQL solta não sabe de quem é a tabela.
 * `lib/descoberta.sql.test.ts` verifica que as quatro continuam usando esse alias.
 */
export const podeSerDescoberto = sql`(
  u.email_verified = true
  or (select count(distinct le_prova.work_id)
        from library_entries le_prova
       where le_prova.user_id = u.id
         and le_prova.visibility = 'public'
         and exists (select 1 from editions e_prova
                      where e_prova.work_id = le_prova.work_id
                        and e_prova.cover_url is not null)) >= ${LIVROS_QUE_PROVAM})`;

/**
 * Quantos livros desta pessoa CONTAM como prova, pela conta de cima.
 *
 * Existe para a tela poder dizer "faltam três" em vez de só "confirme seu e-mail".
 * E é uma consulta, e não uma contagem em cima da lista que a página já tem: a
 * página não carrega a visibilidade de cada linha, e recontar por lá seria uma
 * SEGUNDA definição de "livro que prova" — que divergiria da de cima no primeiro dia
 * em que alguém mexesse numa das duas.
 */
export async function contarLivrosQueProvam(userId: string): Promise<number> {
  const [row] = await db.execute<{ n: number }>(sql`
    select count(distinct le.work_id)::int as n
      from library_entries le
     where le.user_id = ${userId}::uuid
       and le.visibility = 'public'
       and exists (select 1 from editions e
                    where e.work_id = le.work_id and e.cover_url is not null)`);
  return row?.n ?? 0;
}

/**
 * O contrário, para a TELA: esta pessoa está invisível e ainda dá para resolver?
 *
 * Só faz sentido para quem olha o próprio perfil. Dizer a um visitante que o dono da
 * página não confirmou o e-mail seria expor uma pendência dele para estranhos.
 */
export function estaInvisivel(
  emailVerificado: boolean,
  livrosPublicosComCapa: number,
): boolean {
  return !emailVerificado && livrosPublicosComCapa < LIVROS_QUE_PROVAM;
}
