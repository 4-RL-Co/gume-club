/**
 * O "@/" fora do Next.
 *
 * O app inteiro importa por "@/lib/...", que é um alias do tsconfig: o Next o
 * resolve, e o Node puro não. Um script que quer REUSAR as funções do app (em vez
 * de reimplementar o casamento de obra e o portão de autores) precisa que o Node
 * aprenda o alias. É isto, e só isto, que este par de arquivos faz.
 *
 *     node --experimental-strip-types --import ./scripts/alias/registrar.mjs scripts/seu-script.mjs
 */
import { register } from "node:module";
register(new URL("./resolvedor.mjs", import.meta.url));
