import { redirect } from "next/navigation";

/**
 * Esta tela virou uma aba de /pessoas.
 *
 * A rota antiga continua viva e redireciona: alguém pode ter salvo o link, e
 * link salvo que quebra é o app dizendo que o que a pessoa guardou não valia
 * nada. Ela some no dia em que ninguém mais chegar por aqui.
 */
export default async function Redirecionar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const extra = new URLSearchParams({ aba: "recomendacoes" });

  for (const [k, v] of Object.entries(p)) {
    const one = Array.isArray(v) ? v[0] : v;
    if (one) extra.set(k, one);
  }

  redirect(`/pessoas?${extra}`);
}
