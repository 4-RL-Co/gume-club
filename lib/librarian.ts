import { CORRECOES_PARA_BIBLIOTECARIO } from "@/lib/regras";
export { CORRECOES_PARA_BIBLIOTECARIO } from "@/lib/regras";
import { sql, type SQL } from "drizzle-orm";

/**
 * ════════════════════════════════════════════════════════════════════
 *  QUEM É BIBLIOTECÁRIO. Uma regra, um lugar, uma verdade.
 *
 *  ═══ POR QUE ISTO É UM ARQUIVO SÓ ═══
 *
 *  Bibliotecário é as duas coisas ao mesmo tempo: uma INSÍGNIA (o que a
 *  pessoa é) e um PODER (aprovar capa, desfazer o trabalho de outra
 *  pessoa). Se a insígnia e o poder tiverem regras separadas, elas
 *  divergem — e o modo de falha é humilhante: alguém exibe a insígnia de
 *  bibliotecário no perfil e a fila de capas responde "você não pode".
 *
 *  Então a regra mora AQUI, uma vez, e tanto lib/badges.ts quanto
 *  lib/corrections.ts leem daqui. Uma segunda cópia disto é um bug
 *  esperando a próxima pessoa.
 *
 *  ═══ ELE SE GANHA SOZINHO, E TAMBÉM SE CONCEDE ═══
 *
 *  Ninguém precisa pedir a ninguém: quem cuidou muito do catálogo vira
 *  bibliotecário sem que exista alguém para dizer sim. Isso é o ponto.
 *  Um cargo que só o dono distribui é um cargo que não escala e que
 *  transforma o dono num gargalo, e depois num porteiro.
 *
 *  O `librarian_tier` continua existindo e continua valendo: é a porta
 *  MANUAL, para quando faz sentido (alguém de confiança que chegou hoje).
 *  As duas somam: `tier > 0` OU a barra abaixo.
 *
 *  ═══ A BARRA É ALTA, E CADA PEDAÇO DELA TEM UM MOTIVO ═══
 *
 *  Isto NÃO é uma escada de XP: é uma porta. Não existe "faltam 12
 *  correções", não existe nível, não existe progresso na tela. Ou você
 *  passou, ou não passou (ver a regra da insígnia binária em
 *  ai/DECISIONS.md).
 *
 *  50 CORREÇÕES QUE SOBREVIVERAM. Não "feitas": sobreviventes. Correção
 *  que alguém precisou desfazer não conta, e é isso que torna o farm
 *  CARO em vez de lucrativo: quem enche o contador com lixo tem o lixo
 *  revertido e volta para o zero daquele lixo.
 *
 *  30 DIAS DE CONTA. Uma conta criada hoje não vira bibliotecária hoje,
 *  por mais rápido que a pessoa digite. É o que impede a conta
 *  descartável de virar poder de reverter o trabalho dos outros.
 *
 *  NO MÁXIMO 10% REVERTIDO NOS ÚLTIMOS 90 DIAS, E NÃO "NENHUMA REVERSÃO".
 *
 *  "sobre rosangela, se 1 correção for revertida ela ainda ganha, é só se forem
 *  revertidas a ponto do numero minimo nao bater pra insignia" — e depois, quando a
 *  regra de verdade acabou sendo "zero reversão trava tudo": "é mt desproporcional
 *  uma pessoa corrigir 50 livros e se só 1 for revertido ela ja nao ganha" — o dono.
 *
 *  A regra ERA "nenhuma reversão nos últimos 90 dias", ponto — uma correção desfeita
 *  bloqueava a insígnia inteira por 90 dias, não importa se a pessoa tinha 50
 *  correções sobreviventes ou 5.000. Isso mede a pessoa contra ZERO, e ninguém erra
 *  zero vezes em cinquenta tentativas honestas.
 *
 *  Agora mede PROPORÇÃO: quantas das correções que a pessoa já fez, NO TOTAL, foram
 *  revertidas nos últimos 90 dias. Uma reversão isolada numa carreira de 107 correções
 *  é 1%, e não tranca nada. Um padrão de verdade — um décimo do que você fez sendo
 *  desfeito — continua trancando, porque esse sinal ainda importa:
 *  quem está errando muito agora não deveria poder desfazer o trabalho dos outros
 *  agora. A porta continua se fechando e reabrindo sozinha, só que por PROPORÇÃO, e
 *  não por qualquer reversão isolada.
 * ════════════════════════════════════════════════════════════════════
 */

/** Uma conta de hoje não vira bibliotecária hoje. */
export const DIAS_DE_CONTA = 30;

/** A janela em que uma reversão ainda pesa contra a proporção. */
export const DIAS_SEM_REVERSAO = 90;

/**
 * Acima disto, a fração do que a pessoa fez que foi desfeita recentemente é grande
 * demais: 1 em 10 é sinal de um padrão, e não de um deslize. Abaixo, ela continua
 * podendo desfazer o trabalho dos outros mesmo tendo tropeçado uma vez.
 */
export const TAXA_MAXIMA_DE_REVERSAO_RECENTE = 0.1;

/**
 * A condição, em SQL, sobre uma tabela `users` já em escopo com o alias dado.
 *
 * Recebe o alias porque quem chama às vezes tem `users u` e às vezes tem `users`.
 * O alias NUNCA vem de fora do código: é uma constante escrita à mão em cada
 * chamada, e jamais uma string vinda de requisição.
 *
 * `make_interval(days => $1)` e não `interval '30 days'`: o segundo exigiria costurar
 * o número dentro do SQL como texto, e montar SQL a partir de string é proibido neste
 * repo (o `pnpm audit:security` quebra o build). A regra vale até quando o valor é uma
 * constante nossa: uma regra com uma exceção é uma regra que a quarta pessoa não segue.
 */
export function ehBibliotecario(alias: SQL): SQL {
  return sql`(
    -- A PORTA MANUAL. Continua valendo: alguém de confiança que chegou hoje.
    ${alias}.librarian_tier > 0

    OR (
      -- A PORTA QUE SE ABRE SOZINHA.
      (select count(*) from revisions r
        where r.user_id = ${alias}.id and r.reverted_at is null)
        >= ${CORRECOES_PARA_BIBLIOTECARIO}

      and ${alias}.created_at < now() - make_interval(days => ${DIAS_DE_CONTA})

      -- A PROPORÇÃO, E NÃO "NENHUMA REVERSÃO". greatest(1, total) é só uma
      -- trava contra dividir por zero: total nunca é zero de verdade aqui, porque
      -- a linha de cima já exige 50 sobreviventes, e sobrevivente é um subconjunto
      -- de total. Multiplicar (em vez de dividir) evita esse zero de vez.
      and (select count(*) from revisions r2
            where r2.user_id = ${alias}.id
              and r2.reverted_at is not null
              and r2.reverted_at > now() - make_interval(days => ${DIAS_SEM_REVERSAO}))
          <= ${TAXA_MAXIMA_DE_REVERSAO_RECENTE}::float * greatest(
               1, (select count(*) from revisions r3 where r3.user_id = ${alias}.id))
    )
  )`;
}
