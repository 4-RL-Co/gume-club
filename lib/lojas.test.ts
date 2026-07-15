import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A CERCA DO RASPADOR.
 *
 *  O ai/PRD.md permite raspar METADADO FACTUAL quando as fontes abertas
 *  falharem — e elas falharam, e está medido (ver ai/DECISIONS.md):
 *
 *    · o dump da Open Library não tem mangá
 *    · a AniList não sabe o volume BRASILEIRO
 *    · o Google Books devolveu ZERO ISBN brasileiro em 80 resultados de
 *      Berserk e 100 de Chainsaw Man
 *    · a CBL não tem API pública; a Biblioteca Nacional devolve 403
 *
 *  ═══ A LINHA É ENTRE FATO E OBRA ═══
 *
 *  "Este livro tem 320 páginas" é fato: ninguém é dono disso. O ISBN foi
 *  atribuído pela CBL, que é registro nacional — a Panini não é dona dele, ela é
 *  só o único lugar onde ele está visível.
 *
 *  A SINOPSE é obra. Texto autoral, com direito. E o Gume promete um dataset
 *  CC0: pôr texto protegido de terceiro num dataset CC0 é relicenciar o que não é
 *  nosso — a hipocrisia exata que esta política existe para evitar.
 *
 *  ═══ POR QUE UM TESTE, E NÃO UMA PROMESSA ═══
 *
 *  Porque a cerca só vale se ela doer. Uma regra escrita num documento é uma
 *  regra que o próximo commit esquece — e este projeto já viu, esta semana, uma
 *  frase de cabeçalho ("we do not scrape anybody") sobreviver à decisão que ela
 *  descrevia e virar mentira.
 *
 *  Se alguém guardar sinopse, preço ou baixar uma imagem, o build cai aqui.
 * ════════════════════════════════════════════════════════════════════
 */

const RASPADORES = ["lib/lojas.ts", "scripts/lojas.mjs", "seed/lojas.ts"].filter((f) =>
  existsSync(f),
);

/**
 * O QUE NÃO PODE SER GUARDADO. Não é a palavra que ofende: é o campo.
 *
 * `descricao`, `sinopse`, `resumo`, `preco` — se qualquer um deles aparecer sendo
 * ESCRITO, alguém cruzou a linha entre fato e obra.
 */
const PROIBIDO: { rx: RegExp; porque: string }[] = [
  {
    rx: /\b(sinopse|synopsis|descricao|descrição|description|resumo|orelha|blurb)\b\s*[:=]/i,
    porque:
      "SINOPSE. Ela não é fato: é obra, com autor e direito. O dataset do Gume é CC0, e " +
      "pôr texto protegido de terceiro num dataset CC0 é relicenciar o que não é nosso.",
  },
  {
    rx: /\b(preco|preço|price|valor|amount)\b\s*[:=]/i,
    porque:
      "PREÇO. Não é metadado do livro: é a oferta comercial de uma loja, e ela muda toda " +
      "semana. Guardá-lo transformaria o Gume num comparador de preço — que é outro app, " +
      "e não este.",
  },
  {
    rx: /\b(writeFile|createWriteStream|fs\.write|\.pipe\()\s*\(?[^)\n]*\b(jpe?g|png|webp|image|imagem|capa|cover)\b/i,
    porque:
      "IMAGEM BAIXADA. A capa é obra gráfica, com direitos da editora. O Gume guarda a " +
      "URL e serve da origem — mostrar não é republicar. Baixar o arquivo é.",
  },
];

/**
 * O raspador PRECISA se identificar. Um raspador anônimo é um raspador se escondendo.
 *
 * São DUAS perguntas, e não uma: ele manda um `User-Agent`? e esse User-Agent diz quem é
 * o Gume e onde encontrá-lo? A primeira versão deste teste exigia as duas coisas na mesma
 * linha — e reprovava um código correto que guardava a identificação numa constante, que
 * é como se escreve isso direito.
 *
 * Um teste que reprova a forma certa de fazer a coisa certa é um teste que ensina a
 * contorná-lo.
 */
const MANDA_UA = /["']User-Agent["']\s*:/i;
const DIZ_QUEM_E = /Gume\/[\d.]+[^"'\n]*(gume\.club|contato@)/i;

/** E precisa esperar. Uma requisição por segundo, no máximo. */
const ESPERA = /(setTimeout|espera|sleep|delay|pausa)/i;

function arquivos(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const nome of readdirSync(dir)) {
    const cheio = join(dir, nome);
    if (statSync(cheio).isDirectory()) arquivos(cheio, out);
    else if ([".ts", ".mjs"].includes(extname(nome)) && !nome.includes(".test.")) {
      out.push(cheio);
    }
  }
  return out;
}

/** Quem fala com a loja da Panini ou da JBC, esteja onde estiver. */
function raspadores(): string[] {
  const todos = [...arquivos("lib"), ...arquivos("scripts"), ...arquivos("seed")];
  return todos.filter((f) => /panini\.com\.br|editorajbc\.com\.br/i.test(readFileSync(f, "utf8")));
}

describe("o raspador vive dentro da cerca", () => {
  const alvos = raspadores();

  it("os raspadores conhecidos existem, ou nenhum foi escrito ainda", () => {
    // Enquanto não houver raspador, não há o que vigiar — e isso é um estado legítimo.
    expect(Array.isArray(alvos)).toBe(true);
    void RASPADORES;
  });

  it.each(alvos.length ? alvos : ["(nenhum raspador ainda)"])(
    "%s só guarda FATO, e nunca obra de terceiro",
    (arquivo) => {
      if (arquivo === "(nenhum raspador ainda)") return;

      const src = readFileSync(arquivo, "utf8");

      // Comentário não é código: o arquivo PRECISA poder explicar por que não guarda
      // sinopse, e a explicação não pode quebrar o próprio teste.
      const codigo = src
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/^\s*\/\/.*$/gm, " ");

      const cruzou: string[] = [];
      for (const { rx, porque } of PROIBIDO) {
        if (rx.test(codigo)) cruzou.push(porque);
      }

      expect(
        cruzou,
        `${arquivo} cruzou a linha entre FATO e OBRA:\n\n` +
          cruzou.map((c) => `  · ${c}`).join("\n") +
          "\n\nPODE: título, número de volume, ISBN, data, e a URL da capa (referência).\n" +
          "NUNCA: sinopse, orelha, resenha, preço, dado de usuário, imagem baixada.\n\n" +
          "Ver 'Política de catálogo' no ai/PRD.md.",
      ).toEqual([]);
    },
  );

  it.each(alvos.length ? alvos : ["(nenhum raspador ainda)"])(
    "%s diz quem é, e espera entre uma página e outra",
    (arquivo) => {
      if (arquivo === "(nenhum raspador ainda)") return;

      const src = readFileSync(arquivo, "utf8");

      expect(
        MANDA_UA.test(src) && DIZ_QUEM_E.test(src),
        `${arquivo} raspa sem se identificar.\n\n` +
          "O User-Agent tem que dizer quem é o Gume e onde encontrá-lo:\n" +
          '  "Gume/1.0 (registro de leitura aberto; gume.club; contato@gume.club)"\n\n' +
          "Um raspador que diz quem é e onde mora não está se escondendo. Se a editora não " +
          "quiser, ela escreve e a gente para. Um raspador anônimo tira dela até essa " +
          "escolha.",
      ).toBe(true);

      expect(
        ESPERA.test(src),
        `${arquivo} raspa sem pausa entre as páginas.\n\n` +
          "Uma requisição por segundo, no máximo. Ninguém está com pressa, e a loja de " +
          "outra pessoa não é um recurso a ser espremido.",
      ).toBe(true);
    },
  );
});
