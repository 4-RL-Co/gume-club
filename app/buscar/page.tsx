import Link from "next/link";
import { ScreenHeader } from "@/components/screen-header";
import { LiveSearch } from "@/components/live-search";
import { PasteList } from "@/components/paste-list";

export const dynamic = "force-dynamic";

/**
 * One box: books and people. Results while you type.
 *
 * A reader looking for a friend and a reader looking for a book both begin by
 * typing a name, and asking them to pick a tab first is asking a question the app
 * can answer for itself.
 */
export default async function Buscar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 sm:px-10">
      <ScreenHeader title="Buscar" meta={["livros", "pessoas"]} />
      <LiveSearch initial={(raw ?? "").trim()} />

      {/* Duas portas, e elas servem gente diferente. Colar uma lista é para quem
          tem um bloco de notas com quarenta títulos, e ele PERDE TUDO menos o
          título. Trazer o arquivo é para quem tem dez anos de Goodreads, e ele não
          perde nada. Quem tem o arquivo não pode acabar na porta errada. */}
      <PasteList />

      <p className="mt-6 text-[13px] text-[var(--color-ink-faint)]">
        Tem um arquivo do Goodreads, do StoryGraph, do Skoob ou do Fable?{" "}
        <Link href="/importar" className="underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]">
          Traga a estante inteira
        </Link>
        , com as datas, as notas e as resenhas.
      </p>
    </main>
  );
}
