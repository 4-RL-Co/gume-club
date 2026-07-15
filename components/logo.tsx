/**
 * A marca mora em components/mark.tsx.
 *
 * Este arquivo continua existindo porque as telas importam `Mark` e `Logo` daqui.
 * Trocar o import em todas elas no mesmo commit em que a marca muda seria misturar
 * duas mudanças, e aí, se algo quebrar, ninguém sabe qual das duas foi.
 *
 * A marca ANTERIOR era uma régua de 1px afinando até virar fio: o gume visto de
 * perfil, e a mesma régua que atravessa o sistema de design inteiro. Era honesta, e
 * era abstrata demais para carregar um produto sozinha: fora de contexto, ela era um
 * traço. A nova diz a mesma coisa e diz mais: o livro aberto É a lâmina, e a dobra do
 * livro É o fio. Ver docs/design.md, seção "A marca".
 */
export { Mark, Logo, LogoStacked, LIMIAR_SOLIDO } from "@/components/mark";
