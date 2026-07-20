import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { getViewer } from "@/lib/viewer";
import { souIdealizador } from "@/lib/authz";
import { backupComoNdjson } from "@/lib/backup";

/**
 * ════════════════════════════════════════════════════════════════════
 *  BAIXAR O BANCO INTEIRO. A porta mais estreita do app.
 *
 *  SÓ a SESSÃO do idealizador. NÃO aceita o token do painel: o token é para os
 *  números sem e-mail, e este arquivo tem TUDO, inclusive e-mail e estante privada
 *  de todo mundo. Um segredo estático que baixa o banco inteiro é perigoso demais.
 *  Ver lib/backup.ts.
 *
 *  Quem não é o idealizador leva 404, e não 403: a rota não confessa que existe.
 *
 *  Os dois formatos SAEM POR STREAMING, para aguentar um banco grande sem estourar
 *  a memória:
 *   - ?formato=ndjson (padrão): o banco linha a linha, roda em qualquer lugar.
 *   - ?formato=sql            : pg_dump, um dump restaurável, SE o binário existir.
 * ════════════════════════════════════════════════════════════════════
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const viewer = await getViewer();
  if (!(await souIdealizador(viewer))) {
    return new NextResponse("não encontrado", { status: 404 });
  }

  const formato = new URL(req.url).searchParams.get("formato") ?? "ndjson";

  if (formato === "sql") {
    if (!(await pgDumpDisponivel())) {
      return NextResponse.json(
        { erro: "pg_dump não está disponível neste servidor. Use ?formato=ndjson." },
        { status: 501 },
      );
    }
    return new NextResponse(streamPgDump(), {
      status: 200,
      headers: {
        "content-type": "application/sql; charset=utf-8",
        "content-disposition": `attachment; filename="gume-backup.sql"`,
      },
    });
  }

  // NDJSON: uma linha por registro, transmitido por cursor. Ver lib/backup.ts.
  const enc = new TextEncoder();
  const it = backupComoNdjson()[Symbol.asyncIterator]();
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await it.next();
        if (done) controller.close();
        else controller.enqueue(enc.encode(value));
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "content-disposition": `attachment; filename="gume-backup.ndjson"`,
    },
  });
}

/** pg_dump existe nesta máquina? Uma checagem barata antes de prometer o .sql. */
function pgDumpDisponivel(): Promise<boolean> {
  return new Promise((resolve) => {
    let filho;
    try {
      filho = spawn("pg_dump", ["--version"], { stdio: "ignore" });
    } catch {
      return resolve(false);
    }
    filho.on("error", () => resolve(false));
    filho.on("close", (code) => resolve(code === 0));
  });
}

/** O stdout do pg_dump direto na resposta, sem passar pela memória inteira de uma vez. */
function streamPgDump(): ReadableStream<Uint8Array> {
  const url = process.env.DATABASE_URL!;
  const filho = spawn("pg_dump", ["--no-owner", "--no-privileges", url], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  return new ReadableStream<Uint8Array>({
    start(controller) {
      filho.stdout.on("data", (d: Buffer) => controller.enqueue(new Uint8Array(d)));
      filho.stdout.on("end", () => controller.close());
      filho.on("error", (e) => controller.error(e));
    },
    cancel() {
      filho.kill();
    },
  });
}
