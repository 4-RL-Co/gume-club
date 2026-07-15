import { NextResponse } from "next/server";
import { getViewer } from "@/lib/viewer";
import { guardarImagem } from "@/lib/guardar";

/** Node, e não Edge: guardar um arquivo e falar com o banco não existem no Edge. */
export const runtime = "nodejs";

/**
 * Image upload. The reader uploads their own face; we only store it.
 *
 * This is an attack surface, so it is deliberately narrow:
 *
 *  - You must be logged in. An anonymous upload endpoint is a free file host,
 *    and a free file host on your domain is somebody else's malware CDN.
 *  - The TYPE is decided by the first bytes of the file, never by the
 *    Content-Type header or the file name, both of which the client controls.
 *    A .jpg that is really an .html is how you get stored XSS on your own origin.
 *  - The NAME is generated here. Nothing from the client reaches the filesystem,
 *    so "../../etc/passwd" is not a thought anybody needs to have.
 *  - The size is capped before the bytes are read into memory.
 *
 * The client already crops and re-encodes to a small square, so anything arriving
 * here that is larger than the cap is not a photo, it is an attempt.
 *
 * Storage is the local disk by default (self-hosting is the point), configurable
 * via UPLOAD_DIR. S3 slots in behind the same function when the hosted instance
 * needs it.
 */
const MAX_BYTES = 4 * 1024 * 1024;

/** Magic bytes. What a file IS, not what it claims to be. */
const SIGNATURES: [string, number[], string][] = [
  ["image/jpeg", [0xff, 0xd8, 0xff], "jpg"],
  ["image/png", [0x89, 0x50, 0x4e, 0x47], "png"],
  ["image/webp", [0x52, 0x49, 0x46, 0x46], "webp"], // RIFF....WEBP
];

function sniff(bytes: Uint8Array): { mime: string; ext: string } | null {
  for (const [mime, magic, ext] of SIGNATURES) {
    if (magic.every((b, i) => bytes[i] === b)) {
      if (ext === "webp") {
        const tag = new TextDecoder().decode(bytes.slice(8, 12));
        if (tag !== "WEBP") continue;
      }
      return { mime, ext };
    }
  }
  return null;
}

export async function POST(req: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "entre para enviar uma foto" }, { status: 401 });
  }

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) {
    return NextResponse.json({ error: "imagem grande demais" }, { status: 413 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size === 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "imagem inválida" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) {
    return NextResponse.json({ error: "isso não é uma imagem" }, { status: 415 });
  }

  /**
   * ═══ ONDE A FOTO FICA NÃO É DECIDIDO AQUI ═══
   *
   * Isto gravava direto em `public/uploads`. Em serverless, o disco é somente leitura
   * fora de `/tmp` e some entre requisições: **todo upload falharia**, para todo mundo,
   * desde o primeiro minuto — e nenhum teste pegaria, porque em desenvolvimento o disco
   * existe e é gravável.
   *
   * Ver lib/guardar.ts.
   */
  try {
    const { url } = await guardarImagem(bytes, kind.ext, kind.mime);
    return NextResponse.json({ url });
  } catch (e) {
    /**
     * Não dá para dizer "imagem inválida": a imagem estava ótima. O problema é nosso, e a
     * mensagem tem que dizer isso — senão a pessoa fica trocando de foto a tarde inteira
     * tentando adivinhar o que ELA fez de errado.
     */
    console.error("upload: não deu para guardar a imagem", e);

    return NextResponse.json(
      { error: "Não conseguimos guardar a foto agora. O problema é nosso, e não seu." },
      { status: 500 },
    );
  }
}
