/**
 * Um CSV que sobrevive ao mundo real.
 *
 * Nada de biblioteca: são quarenta linhas, e uma dependência nova num repo que tem
 * oito precisa valer mais do que isto vale. Mas ele precisa aguentar o que os
 * arquivos de verdade trazem, e eles trazem tudo:
 *
 *   · vírgula DENTRO de aspas ("Ficções, e outros contos")
 *   · aspas escapadas ("" vira ")
 *   · QUEBRA DE LINHA dentro de um campo, que é o normal numa resenha de três
 *     parágrafos, e é o que faz um `split("\n")` ingênuo picar o arquivo inteiro
 *   · CRLF do Windows
 *   · o BOM que o Excel enfia na frente e que faz o PRIMEIRO cabeçalho não casar
 *     com nada, quebrando o import inteiro por um caractere invisível
 *   · separador ; em vez de , (o padrão do Excel em português)
 */

/** O separador, adivinhado pela primeira linha. Excel brasileiro usa ponto e vírgula. */
function separador(texto: string): "," | ";" | "\t" {
  const linha = texto.slice(0, texto.indexOf("\n") + 1 || 500);
  const conta = (c: string) => (linha.match(new RegExp(`\\${c}`, "g")) ?? []).length;
  const tab = conta("\t");
  const virgula = conta(",");
  const pontoEVirgula = conta(";");
  if (tab > virgula && tab > pontoEVirgula) return "\t";
  if (pontoEVirgula > virgula) return ";";
  return ",";
}

/** As linhas, como listas de células. */
export function parseCsv(texto: string): string[][] {
  // O BOM é invisível e quebra o primeiro cabeçalho. Ele sai antes de tudo.
  const limpo = texto.replace(/^﻿/, "");
  const sep = separador(limpo);

  const linhas: string[][] = [];
  let linha: string[] = [];
  let celula = "";
  let dentroDeAspas = false;

  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i]!;

    if (dentroDeAspas) {
      if (c === '"' && limpo[i + 1] === '"') {
        celula += '"';
        i++;
      } else if (c === '"') {
        dentroDeAspas = false;
      } else {
        celula += c; // inclusive \n: uma resenha de três parágrafos é UMA célula
      }
      continue;
    }

    if (c === '"') dentroDeAspas = true;
    else if (c === sep) {
      linha.push(celula);
      celula = "";
    } else if (c === "\n") {
      linha.push(celula);
      linhas.push(linha);
      linha = [];
      celula = "";
    } else if (c !== "\r") {
      celula += c;
    }
  }

  if (celula || linha.length) {
    linha.push(celula);
    linhas.push(linha);
  }

  return linhas.filter((l) => l.some((v) => v.trim() !== ""));
}

/** O CSV como uma lista de objetos, com o cabeçalho normalizado. */
export function parseCsvObjetos(texto: string): Record<string, string>[] {
  const [cabecalho, ...corpo] = parseCsv(texto);
  if (!cabecalho) return [];

  const chaves = cabecalho.map(normalizar);

  return corpo.map((linha) =>
    Object.fromEntries(chaves.map((k, i) => [k, (linha[i] ?? "").trim()])),
  );
}

/**
 * O cabeçalho, normalizado.
 *
 * "Date Read", "date read" e "DATE READ " são a mesma coluna, e nenhum arquivo de
 * verdade é consistente. Sem isto, o import quebra por causa de um espaço.
 */
export function normalizar(chave: string): string {
  return chave
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * O ISBN, tirando a BLINDAGEM DO EXCEL.
 *
 * O Goodreads exporta `="9788535902775"`, com o igual e as aspas, para o Excel não
 * comer o zero da frente. Se você não desarmar isso, TODO ISBN falha, nada casa
 * com o catálogo de 414 mil edições, e cada livro vira uma obra duplicada nova.
 */
export function isbn(bruto: string | undefined): { isbn13: string | null; isbn10: string | null } {
  const limpo = (bruto ?? "").replace(/^="?|"?$/g, "").replace(/[^0-9Xx]/g, "").toUpperCase();
  if (limpo.length === 13) return { isbn13: limpo, isbn10: null };
  if (limpo.length === 10) return { isbn13: null, isbn10: limpo };
  return { isbn13: null, isbn10: null };
}

/** Um ano que faz sentido. 2301 e 0123 são lixo, e lixo não entra no catálogo. */
export function ano(bruto: string | undefined): number | null {
  const n = parseInt((bruto ?? "").trim(), 10);
  if (!Number.isInteger(n)) return null;
  return n >= -3000 && n <= new Date().getFullYear() + 1 ? n : null;
}

/**
 * Uma data, em "YYYY-MM-DD". `null` quando não dá para saber.
 *
 * NUNCA INVENTA O DIA. Uma data chutada é uma mentira que a pessoa carrega para
 * sempre, e ela aparece na retrospectiva do ano dela. "2019" sozinho vira null:
 * uma leitura sem data ainda é um fato; uma leitura com a data errada é lixo.
 *
 * Formatos que os arquivos de verdade trazem: 2019/03/07 (Goodreads), 2019-03-07
 * (StoryGraph), 07/03/2019 (planilha em português).
 */
export function data(bruto: string | undefined): string | null {
  const s = (bruto ?? "").trim();
  if (!s) return null;

  // 2019/03/07 e 2019-03-07
  const iso = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (iso) return `${iso[1]}-${pad(iso[2]!)}-${pad(iso[3]!)}`;

  // 07/03/2019: dia primeiro, que é como se escreve em português
  const br = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (br) return `${br[3]}-${pad(br[2]!)}-${pad(br[1]!)}`;

  return null; // "2019", "May 2016", "sem data": não dá para saber o DIA
}

function pad(n: string): string {
  return n.padStart(2, "0");
}
