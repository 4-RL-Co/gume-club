import { redirect } from "next/navigation";

/**
 * /colecao virou um filtro dentro de /estante. "acho que dá pra ficar
 * apenas mais uma aba dentro da pagina /estante, ou até mesmo um filtro:
 * tenho, aí filtra na estante" — o dono. Ver app/estante/page.tsx
 * (?posse=tenho|quero) e components/colecao-grid.tsx.
 *
 * Link antigo com ?ver=quero continua indo pro lugar certo — só muda o
 * endereço.
 */
export default async function Colecao({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const ver = Array.isArray(params.ver) ? params.ver[0] : params.ver;
  redirect(ver === "quero" ? "/estante?posse=quero" : "/estante?posse=tenho");
}
