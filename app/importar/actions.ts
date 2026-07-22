"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/lib/actor";
import { LIMITS } from "@/lib/limits";
import { parse, detectar } from "@/lib/import/parse";
import { aplicar } from "@/lib/import/aplicar";
import { procurarNoCatalogo, type Achado } from "@/lib/import/casar";
import { LOTE, type LivroImportado, type Relatorio, type Fonte } from "@/lib/import/tipos";

/**
 * A PRÉVIA VEM ANTES DA GRAVAÇÃO, SEMPRE.
 *
 * O app mostra o que entendeu ANTES de escrever qualquer coisa na estante, e a
 * pessoa confirma. É a mesma dança do "colar uma lista", pelo mesmo motivo: um erro
 * que entra sozinho numa estante de 200 livros é um erro que ninguém percebe por
 * dois anos.
 */
export type Previa = {
  fonte: Fonte;
  livros: LivroImportado[];
  /** O que a gente NÃO vai trazer, dito ANTES de a pessoa confirmar. */
  avisos: string[];
};

export async function ler(texto: string): Promise<Previa> {
  await getActor();

  if (texto.length > LIMITS.importBytes) {
    throw new Error("esse arquivo é grande demais");
  }

  const fonte = detectar(texto);
  const livros = parse(texto);
  const avisos: string[] = [];

  // O aviso de perda ("uma e duas estrelas caem na mesma palavra") morava aqui e
  // saiu: desde que o degrau 1 virou julgamento ("detestei"), cada estrela tem a
  // sua palavra e não há perda a declarar. Ver lib/veredito.ts.
  const semData = livros.filter(
    (l) => l.status === "read" && l.leituras.every((r) => !r.terminou),
  ).length;
  if (semData > 0) {
    avisos.push(
      `${semData} ${semData === 1 ? "livro veio" : "livros vieram"} marcados como lidos sem a data. Eles entram assim: quem não guardou o dia foi o arquivo.`,
    );
  }

  /**
   * ═══ A RELEITURA QUE O ARQUIVO NÃO SABE DATAR ═══
   *
   * O Goodreads exporta UMA data e um `Read Count`. Quem leu três vezes e só tem a data da
   * última leu TRÊS VEZES — e jogar duas fora seria apagar duas leituras que aconteceram.
   *
   * A gente cria as três, a última com data e as outras sem. E diz isso: uma leitura sem
   * data é um fato ("eu li, não sei quando"), e não um erro.
   */
  const releituras = livros.filter((l) => l.leituras.length > 1).length;
  if (releituras > 0) {
    avisos.push(
      `${releituras} ${releituras === 1 ? "livro foi lido" : "livros foram lidos"} mais de uma vez. ` +
        "O arquivo só guarda a data da última, então as outras leituras entram sem data: elas " +
        "aconteceram, e o dia é que não veio.",
    );
  }

  /**
   * ═══ AS COLUNAS QUE A GENTE IGNORA DE PROPÓSITO ═══
   *
   * Perda silenciosa é o que faz alguém descobrir dois anos depois que a estante mentiu. O
   * Goodreads exporta uma dúzia de coisas que não existem aqui, e o silêncio sobre elas é
   * uma escolha nossa — então ela é dita.
   */
  if (fonte === "goodreads") {
    avisos.push(
      "Duas coisas do Goodreads não vêm: a nota MÉDIA dos outros leitores (aqui não existe " +
        "média) e a data em que você marcou cada prateleira. O resto vem inteiro.",
    );
  }

  if (fonte === "desconhecida" && livros.length > 0) {
    avisos.push(
      "Não reconhecemos de onde veio este arquivo, então trouxemos o que deu para entender. Confira a lista antes de confirmar.",
    );
  }

  return { fonte, livros: livros.slice(0, LIMITS.importLinhas), avisos };
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  ONDE CADA LIVRO FOI PARAR NO CATÁLOGO. Sem escrever nada.
 *
 *  A prévia mostrava o que o PARSER entendeu do arquivo — e essa não é a pergunta que
 *  importa. A pessoa não precisa conferir se a gente leu "Dom Casmurro" na linha do CSV:
 *  ela precisa conferir em QUE LIVRO aquilo foi parar.
 *
 *  E precisa saber COMO: casar por ISBN é um fato, casar por título é um palpite. A tela
 *  mostra a diferença, porque ela precisa poder desconfiar do segundo sem desconfiar do
 *  primeiro. Ver lib/import/casar.ts.
 *
 *  ═══ EM LOTES, E O LOTE VEM DO CLIENTE ═══
 *
 *  Quatrocentos livros são quatrocentas buscas no catálogo, e elas NÃO CABEM numa
 *  requisição: a função morre no meio do caminho, e a pessoa vê "erro" depois de esperar
 *  dois minutos por um arquivo que ela levou uma hora para exportar do outro app.
 *
 *  O cliente pede um lote de cada vez, e mostra a barra andando. Sessenta por vez: é
 *  rápido o bastante para a tela não travar, e grande o bastante para quatrocentos livros
 *  serem sete idas, e não quatrocentas.
 * ════════════════════════════════════════════════════════════════════
 */
export async function procurar(livros: LivroImportado[]): Promise<Achado[]> {
  await getActor();

  if (livros.length > LOTE) {
    throw new Error("lote grande demais");
  }

  return procurarNoCatalogo(livros);
}

/**
 * Só depois que ela conferiu. E também em lotes, pelo mesmo motivo: gravar quatrocentos
 * livros é gravar quatrocentas estantes, quatrocentas leituras e quatrocentas notas.
 */
export async function importar(livros: LivroImportado[]): Promise<Relatorio> {
  const actor = await getActor();

  if (livros.length > LOTE) {
    throw new Error("lote grande demais");
  }

  const relatorio = await aplicar(actor, livros);

  revalidatePath("/");
  revalidatePath("/estante");
  revalidatePath("/estatisticas");
  return relatorio;
}
