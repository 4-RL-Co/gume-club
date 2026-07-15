import Link from "next/link";
import { ScreenHeader } from "@/components/screen-header";

/**
 * ════════════════════════════════════════════════════════════════════
 *  NÃO ACHAMOS ESTA PÁGINA.
 *
 *  ═══ O QUE ACONTECIA ANTES ═══
 *
 *  Nada. Literalmente: um endereço que não existe — uma coleção apagada, um perfil
 *  removido, um link velho, um slug digitado errado — abria a barra lateral e **uma
 *  página em branco no meio**.
 *
 *  Sem `not-found.tsx`, o `notFound()` cai no padrão do Next, e o padrão do Next dentro
 *  do nosso layout não desenha nada. Cinco rotas faziam isso: o livro, o autor, a
 *  coleção, a série, a estante e o perfil.
 *
 *  Uma página em branco não é uma resposta. É o app parecendo quebrado — e a pessoa não
 *  tem como saber se o problema é o endereço dela ou nós.
 *
 *  ═══ E O QUE ELA NÃO FAZ ═══
 *
 *  Não pede desculpa, e não diz "ops". A pessoa digitou um endereço que não existe;
 *  ninguém precisa de um pedido de desculpas por isso. Ela precisa de uma saída.
 * ════════════════════════════════════════════════════════════════════
 */
export default function NaoAchamos() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <ScreenHeader title="Esta página não existe." />

      <p className="voice mt-6 max-w-prose text-[17px] leading-relaxed text-[var(--color-ink-soft)]">
        Ou o endereço está errado, ou o que estava aqui saiu do ar. Acontece.
      </p>

      <p className="mt-8 text-[15px] text-[var(--color-ink-soft)]">
        <Link
          href="/"
          className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
        >
          Voltar para o começo
        </Link>
      </p>
    </main>
  );
}
