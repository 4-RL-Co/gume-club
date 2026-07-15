import Link from "next/link";
import { Prosa } from "@/components/prosa";

/**
 * The author, as an entity.
 *
 * An author was a line of grey text under the title. That is a dashboard talking
 * about a foreign key. On a page about a book, the person who wrote it deserves a
 * panel: a portrait, a name in the display serif, the nationality in small caps.
 * See ai/DECISIONS.md ("editorial de galeria") and the Country Books reference.
 *
 * We have no portraits yet, and inventing one would be worse than not having one,
 * so the placeholder is the same printing-ink material as a generated cover: the
 * initials, in letterspaced caps, on a block of ink. It is quiet on purpose. When
 * a real portrait exists it drops into the same slot and simply carries colour.
 */
const INKS = ["#242422", "#2E2E2B", "#3A1E22", "#1F2C43", "#1E332B", "#4A3620", "#2B2233", "#33291F"];
const PAPER = "240 236 228";

/** "Machado de Assis" -> "MA". Two initials, never three: this is a monogram, not a label. */
function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => w.length > 2);
  const first = words[0] ?? name;
  const last = words.length > 1 ? words[words.length - 1]! : "";
  return ((first[0] ?? "") + (last[0] ?? "")).toUpperCase() || "?";
}

export function AuthorPanel({
  name,
  slug,
  nationality,
  portraitUrl,
  bio,
  bioSource,
}: {
  name: string;
  /** Sem slug o autor não tem página, e o painel é um retrato que não leva a lugar nenhum. */
  slug?: string | null;
  nationality?: string | null;
  portraitUrl?: string | null;
  /** Quem foi essa pessoa, em uma frase. Ver components/prosa.tsx. */
  bio?: string | null;
  bioSource?: string | null;
}) {
  let h = 0;
  for (const c of name) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  const ink = INKS[Math.abs(h) % INKS.length];

  /* O PAINEL INTEIRO É A PORTA. O leitor clica no retrato ou no nome, e vai para a
     página do autor — o resto da obra dele, a biografia, o país. Antes isto era um
     cartão bonito e morto. */
  const ficha = (
    <div className="flex items-center gap-5">
        <div
          className="cover-lift flex h-20 w-20 shrink-0 items-center justify-center sm:h-24 sm:w-24"
          style={{ background: portraitUrl ? undefined : ink, borderRadius: "var(--radius-cover)" }}
        >
          {portraitUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portraitUrl}
              alt={name}
              className="h-full w-full object-cover"
              style={{ borderRadius: "var(--radius-cover)" }}
            />
          ) : (
            <span
              className="uppercase"
              style={{
                fontSize: 20,
                letterSpacing: "0.14em",
                textIndent: "0.14em", // letter-spacing pads the right; put it back
                color: `rgb(${PAPER} / 0.62)`,
              }}
            >
              {initials(name)}
            </span>
          )}
        </div>

      <div className="min-w-0">
        <p className="voice text-2xl leading-tight">{name}</p>
        {nationality && (
          <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {nationality}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <section className="surface p-6">
      <h2 className="mb-5 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        autor
      </h2>

      {slug ? (
        <Link href={`/autor/${slug}`} className="block transition-opacity hover:opacity-80">
          {ficha}
        </Link>
      ) : (
        ficha
      )}

      {/* ═══ UMA FRASE SOBRE QUEM ESCREVEU ═══

          O painel tinha nome, retrato e nacionalidade: três dados, e nenhuma frase.
          Quem não conhece o autor saía da página sem saber nada sobre ele.

          A Prosa cuida do resto: ela limpa o markdown, diz de onde o texto veio, e
          ESCONDE o que estiver em inglês — a maioria de quem lê aqui não lê em inglês,
          e uma frase que a pessoa não entende é pior do que nenhuma. */}
      <Prosa texto={bio ?? null} fonte={bioSource ?? null} className="mt-5" />
    </section>
  );
}
