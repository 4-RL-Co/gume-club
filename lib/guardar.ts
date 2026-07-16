import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ONDE A FOTO DE PERFIL FICA GUARDADA.
 *
 *  ═══ O BUG QUE ESTE ARQUIVO EXISTE PARA IMPEDIR ═══
 *
 *  A foto era gravada em `public/uploads`, no disco da máquina. Isso está certo num
 *  servidor de verdade, e é o que faz o auto-hospedar funcionar sem contratar nada.
 *
 *  Em serverless, o disco:
 *
 *    1. é SOMENTE LEITURA fora de `/tmp` — então `writeFile` levanta, e **toda foto de
 *       perfil falharia ao subir**, para todo mundo, desde o primeiro minuto; e
 *    2. some entre uma requisição e outra — então, mesmo que gravasse, a foto viraria um
 *       endereço 404 assim que a instância morresse.
 *
 *  Nenhum teste pegaria isso: em desenvolvimento o disco existe e é gravável. É um bug
 *  que só aparece em produção, no dia do lançamento, na cara da primeira pessoa que
 *  tentar pôr uma foto.
 *
 *  ═══ AS DUAS CASAS, E COMO ELE ESCOLHE ═══
 *
 *  Se existe um `BLOB_READ_WRITE_TOKEN`, a foto vai para o armazenamento de objetos, que
 *  não é o disco de ninguém e sobrevive à instância. É o caminho da produção.
 *
 *  Se não existe, vai para o disco — que é o certo em desenvolvimento e em quem
 *  auto-hospeda num servidor com disco.
 *
 *  ═══ E EM PRODUÇÃO ELE NÃO TENTA O DISCO. ELE GRITA ═══
 *
 *  Cair calado no disco em produção seria pegar um problema de configuração e traduzi-lo
 *  num erro estranho, mais tarde, em outro lugar — a lei que o AGENTS.md chama de "nunca
 *  traduza falha em outra coisa". Sem armazenamento configurado, a resposta é uma frase
 *  que diz exatamente o que falta.
 * ════════════════════════════════════════════════════════════════════
 */

export type Guardada = { url: string };

export async function guardarImagem(
  bytes: Uint8Array,
  ext: string,
  mime: string,
  // Onde no Blob a imagem mora. A foto de perfil vai para `avatares/`; a capa de um livro,
  // para `capas/`. É o mesmo store e o mesmo token — só uma pasta para não misturar.
  pasta: "avatares" | "capas" = "avatares",
): Promise<Guardada> {
  // O nome é NOSSO. Nada que o cliente mandou encosta no caminho do arquivo, e por isso
  // "../../etc/passwd" não é um pensamento que alguém precise ter.
  const nome = `${randomUUID()}.${ext}`;

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (token) {
    const { url } = await put(`${pasta}/${nome}`, Buffer.from(bytes), {
      access: "public",
      contentType: mime,
      token,
      // O nome já é um UUID. Deixar a biblioteca acrescentar um sufixo aleatório só faria
      // o endereço ficar feio sem ficar mais seguro.
      addRandomSuffix: false,
    });

    return { url };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Não há onde guardar a foto: falta BLOB_READ_WRITE_TOKEN. Em serverless o disco é " +
        "somente leitura e some entre requisições, então gravar em disco aqui seria " +
        "prometer uma foto que não existiria daqui a um minuto.",
    );
  }

  const dir = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, nome), bytes);

  return { url: `/uploads/${nome}` };
}
