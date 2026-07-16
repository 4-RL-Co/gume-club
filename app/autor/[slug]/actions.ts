"use server";

import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/viewer";
import { limitarEscrita } from "@/lib/escrita";
import {
  corrigirAutor, corrigirRetrato, homonimoDe, fundirAutores,
  type CampoAutor, type Homonimo,
} from "@/lib/corrections";
import { porQueNaoAceita } from "@/lib/imagens";
import { Forbidden } from "@/lib/authz";

/**
 * Corrigir a ficha de um autor.
 *
 * O nome vem do dump da Open Library escrito de qualquer jeito ("Machado De ASSIS"),
 * a nacionalidade está quase toda vazia, e até hoje não havia como um leitor arrumar
 * nada disso. A EDIÇÃO era corrigível desde a fatia 1; o autor, não, e não havia
 * motivo.
 *
 * Não pede permissão, e isso é o desenho: toda correção grava uma revisão com o NOME
 * de quem fez, pública e para sempre. É a assinatura, e não a permissão, que torna o
 * vandalismo caro.
 */
export async function corrigir(
  authorId: string,
  slug: string,
  campo: CampoAutor,
  valor: string,
  motivo: string,
): Promise<void> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);
  await corrigirAutor(viewer, authorId, campo, valor, motivo || null);

  revalidatePath(`/autor/${slug}`);
}

/**
 * ════════════════════════════════════════════════════════════════════
 *  A FICHA INTEIRA, DE UMA VEZ. E a verdade quando o nome já existe.
 *
 *  ═══ OS DOIS BUGS QUE ISTO MATA ═══
 *
 *  1. A tela pedia UM campo por vez, e trocar de campo apagava o que você tinha
 *     digitado. Arrumar nome e nacionalidade eram duas viagens, e ninguém descobria
 *     isso antes de perder o texto.
 *
 *  2. Arrumar o NOME estourava. `authors.name` é único, o dump tem a mesma pessoa
 *     escrita de seis jeitos, e normalizar um deles colide com a forma certa que já
 *     existe. A tela dizia "não deu para arrumar agora" — uma frase que não diz nada
 *     sobre um fato muito específico.
 *
 *  ═══ POR QUE O RESULTADO É UM VALOR, E NÃO UMA EXCEÇÃO ═══
 *
 *  O Next apaga a mensagem de um erro lançado numa ação de servidor em produção. E o
 *  que esta função tem a dizer não é um vazamento: é uma PERGUNTA ("já existe um
 *  Oswaldo França Júnior com 12 livros, são a mesma pessoa?"). Lançada, ela morreria
 *  no caminho e viraria de novo o "não deu" sem motivo.
 * ════════════════════════════════════════════════════════════════════
 */
export type Salvou =
  | { ok: true }
  | { erro: string }
  /** O nome já é de outro. Não é erro: é uma pergunta. Ver fundir(), abaixo. */
  | { homonimo: Homonimo };

export async function salvarAutor(
  authorId: string,
  slug: string,
  campos: { name: string; nationality: string; bio: string },
  motivo: string,
): Promise<Salvou> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);

  const razao = motivo || null;

  try {
    /**
     * Nacionalidade e "quem é" gravam SEMPRE, mesmo que o nome vá abrir uma pergunta.
     * O trabalho da pessoa não pode ficar refém de uma decisão sobre outro campo: ela
     * digitou três coisas, e duas delas não têm dúvida nenhuma.
     */
    await corrigirAutor(viewer, authorId, "nationality", campos.nationality, razao);
    await corrigirAutor(viewer, authorId, "bio", campos.bio, razao);

    const nome = campos.name.trim();
    if (nome) {
      const homonimo = await homonimoDe(nome, authorId);

      if (homonimo?.colide) {
        return {
          erro:
            `Já existe um ${homonimo.name}, e os dois têm o mesmo livro. Juntar os dois ` +
            "exigiria juntar os livros também, e isso mexe na estante de outras pessoas. " +
            "Esse conserto ainda não existe, e o resto do que você arrumou foi salvo.",
        };
      }

      // Existe outro com esse nome, e dá para juntar. A tela pergunta antes de fundir.
      if (homonimo) return { homonimo };

      await corrigirAutor(viewer, authorId, "name", nome, razao);
    }
  } catch {
    return { erro: "Não deu para gravar agora. O problema é nosso, e não seu." };
  }

  revalidatePath(`/autor/${slug}`);
  return { ok: true };
}

/** "São a mesma pessoa": os livros do duplicado vêm para cá, e o nome dele vira apelido. */
export async function fundir(
  deId: string,
  paraId: string,
  slug: string,
  motivo: string,
): Promise<{ erro: string | null }> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);

  try {
    await fundirAutores(viewer, deId, paraId, motivo || null);
  } catch (e) {
    if (e instanceof Forbidden) {
      return { erro: "Esses dois têm o mesmo livro: juntar exigiria juntar as obras também." };
    }
    return { erro: "Não deu para juntar agora. O problema é nosso." };
  }

  revalidatePath(`/autor/${slug}`);
  return { erro: null };
}

/**
 * O retrato. Só bibliotecário: imagem é o único campo onde o vandalismo tem plateia.
 *
 * ═══ A RECUSA VOLTA COMO VALOR, E NÃO COMO EXCEÇÃO ═══
 *
 * O Next **apaga a mensagem** de um erro lançado dentro de uma ação de servidor quando
 * o app roda em produção — o cliente recebe "an error occurred", e nada mais. É de
 * propósito: uma mensagem de erro pode carregar caminho de arquivo, nome de tabela,
 * consulta inteira.
 *
 * Só que a nossa recusa não é um vazamento: é uma INSTRUÇÃO ("o Gume só aceita imagem
 * do Wikimedia Commons; na Wikipédia, clique na foto e copie o endereço do arquivo").
 * Lançada, ela morreria no caminho e a pessoa veria um "não deu" sem motivo — que é o
 * bug de novo, com outra roupa.
 *
 * Então ela volta como um valor de retorno, que o Next entrega inteiro.
 */
export async function trocarRetrato(
  authorId: string,
  slug: string,
  url: string,
  motivo: string,
): Promise<{ erro: string | null }> {
  const viewer = await getViewer();
  if (viewer) await limitarEscrita(viewer.id);

  /**
   * A recusa CONHECIDA é conferida aqui, e devolvida inteira. Ela é uma instrução, e a
   * pessoa precisa dela para acertar na segunda tentativa.
   *
   * O resto — banco fora do ar, transação que falhou — vira uma frase genérica, porque
   * a mensagem de um erro de banco carrega nome de tabela e consulta, e isso não desce
   * para o navegador de ninguém. `corrigirRetrato` confere a origem de novo do outro
   * lado: é ela que fecha a porta contra um POST direto, e esta checagem aqui existe
   * só para a frase chegar viva até a tela.
   */
  const naoAceita = porQueNaoAceita(url);
  if (naoAceita) return { erro: naoAceita };

  try {
    await corrigirRetrato(viewer, authorId, url, motivo || null);
  } catch (e) {
    if (e instanceof Forbidden) return { erro: "Só bibliotecário troca o retrato." };
    return { erro: "Não deu para trocar o retrato agora. O problema é nosso." };
  }

  revalidatePath(`/autor/${slug}`);
  return { erro: null };
}
