import { createConnection } from "node:net";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM AVISO, PORQUE UM VERMELHO QUE MENTE É PIOR QUE NENHUM TESTE.
 *
 *  FATO, reproduzido seis vezes: com o `pnpm dev` de pé, os testes de
 *  SQL da busca (lib/forgiveness, lib/pool) falham. Com ele desligado,
 *  passam. Sempre.
 *
 *  A CAUSA RAIZ EU NÃO SEI, e não vou inventar uma. Os limiares do
 *  trigrama são por conexão, o pool é de dez e o Postgres aguenta cem,
 *  então não é conexão esgotada. Fica anotado em
 *  docs/O-QUE-FALTA-NO-CODIGO.md, com o conserto de verdade: um BANCO DE
 *  TESTE separado, que é o que todo projeto adulto faz e este ainda não
 *  faz.
 *
 *  Enquanto isso, este aviso existe por um motivo específico: um teste
 *  que falha por um motivo que não é o dele TREINA a pessoa a ignorar o
 *  vermelho. E o vermelho é a sentinela deste repo (ver AGENTS.md): no
 *  dia em que ele virar ruído, ele para de proteger.
 *
 *  Ele AVISA, e não quebra: derrubar o teste de alguém porque o dev está
 *  aberto seria trocar um problema por outro.
 * ════════════════════════════════════════════════════════════════════
 */
export async function setup() {
  const devDePe = await new Promise<boolean>((resolve) => {
    const socket = createConnection({ port: 3000, host: "127.0.0.1" });
    socket.setTimeout(300);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });

  if (devDePe) {
    console.warn(
      "\n\x1b[33m⚠  O `pnpm dev` está de pé, e ele disputa o mesmo Postgres.\x1b[0m\n" +
        "   Se algum teste de SQL falhar agora, DESCONFIE: pode não ser você.\n" +
        "   Derrube o dev e rode de novo antes de acreditar no vermelho.\n" +
        "   (Isto é um problema conhecido: ver docs/O-QUE-FALTA-NO-CODIGO.md.)\n",
    );
  }
}
