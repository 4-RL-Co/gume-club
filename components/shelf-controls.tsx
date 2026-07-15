import Link from "next/link";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  FILTERS, SORTS, DIRECAO_LABEL, DIRECAO_PADRAO,
  type FilterKey, type SortKey, type View, type Direcao,
} from "@/lib/shelf-view";

/**
 * Sort and the view toggle. All of it is links, not client state: the shelf is a
 * server component, so the URL is the state. Every view of the shelf is a
 * shareable address, and it costs zero JavaScript.
 *
 * The shelves used to live here too, next to a caps "ORDEM" label that collided
 * with the last chip and forced "ano da obra" to wrap onto three lines. They are
 * in the sidebar now, which is why nothing here can overlap any more: one row,
 * two items, both nowrap.
 *
 * On a phone there is no sidebar, so the shelves come back as a scrolling row.
 * That is not a duplicate control, it is the same control at the only size where
 * a column does not exist.
 */
type Props = {
  filter: FilterKey;
  sort: SortKey;
  view: View;
  direcao: Direcao;
  /** O ano escolhido, ou null. */
  ano: number | null;
  /** Os anos que EXISTEM. Vazio fora de "lidos" e "abandonados". */
  anos: number[];
  counts: Record<string, number>;
};

function href(
  next: Partial<{ filtro: string; ordem: string; vista: string; dir: string; ano: string }>,
  current: Props,
) {
  const params = new URLSearchParams({
    filtro: next.filtro ?? current.filter,
    ordem: next.ordem ?? current.sort,
    vista: next.vista ?? current.view,
  });

  /**
   * Trocar de CRITÉRIO reseta a direção para o padrão daquele critério.
   *
   * Quem estava em "adicionado, os mais novos" e clica em "título" quer A a Z, e
   * não Z a A. Carregar a direção anterior para o critério novo é o app lembrando
   * de uma coisa que a pessoa não pediu para ele lembrar.
   */
  const ordem = (next.ordem ?? current.sort) as SortKey;
  const dir = next.dir ?? (next.ordem ? DIRECAO_PADRAO[ordem] : current.direcao);
  if (dir !== DIRECAO_PADRAO[ordem]) params.set("dir", dir);

  // Trocar de prateleira LARGA o ano: "abandonados em 2021" e depois "esperando"
  // não é "esperando em 2021", que não quer dizer nada.
  const ano = next.ano ?? (next.filtro ? "" : current.ano ? String(current.ano) : "");
  if (ano) params.set("ano", ano);

  return `/estante?${params}`;
}

const NO_SCROLLBAR = "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/** Bleeds to the screen edge so a scrolling row does not look clipped. Full width only. */
const BLEED = `-mx-6 flex overflow-x-auto px-6 sm:mx-0 sm:px-0 ${NO_SCROLLBAR}`;

/**
 * Scrolls inside its own box. Used for the sort row, which shares a flex line
 * with the view toggle: the negative margins of BLEED would widen it past the
 * viewport and shove the toggle off the right edge of a phone.
 */
const INLINE = `flex min-w-0 flex-1 overflow-x-auto ${NO_SCROLLBAR}`;

export function ShelfControls(props: Props) {
  const { filter, sort, view, direcao, ano, anos, counts } = props;
  const inverso: Direcao = direcao === "asc" ? "desc" : "asc";

  return (
    <div className="surface mt-10 flex flex-col gap-4 p-6">
      {/*
        As prateleiras. Elas moravam na barra lateral, e não deviam: a barra
        responde ONDE ESTOU, e "lendo" não é um lugar, é um recorte da estante.
        Filtro mora na tela que ele filtra, com a contagem do lado, e a aba ativa
        continua indo para a URL (?filtro=lendo), que é o que faz um recorte ser
        um link que dá para mandar para alguém.
      */}
      <div className={`${BLEED} gap-1.5`}>
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href({ filtro: f.key }, props)}
            aria-current={f.key === filter ? "page" : undefined}
            className={[
              "pill flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-2 text-[14px] transition-colors",
              f.key === filter
                ? "afiado font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-soft)] hover:bg-white/[0.03] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            {f.label}
            <span className="tabular text-[12px] text-[var(--color-ink-faint)]">
              {counts[f.key] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      {/**
        * O ANO, e só em "lidos" e "abandonados".
        *
        * "Livros que eu quero ler em 2024" não quer dizer nada: um livro esperando
        * na estante não aconteceu em ano nenhum. Um livro LIDO ou LARGADO aconteceu,
        * e esse ano é um fato sobre a sua vida.
        *
        * Só os anos que EXISTEM são oferecidos: uma lista com buracos (2019, 2021) é
        * honesta, e uma contínua com um ano vazio no meio é o app inventando uma
        * pergunta que não tem resposta.
        */}
      {anos.length > 0 && (
        <div className={`${BLEED} items-center gap-1.5`}>
          <Link
            href={href({ ano: "" }, props)}
            aria-current={ano === null ? "page" : undefined}
            className={[
              "pill shrink-0 whitespace-nowrap px-4 py-1.5 text-[13px] transition-colors",
              ano === null
                ? "afiado font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            todo ano
          </Link>

          {anos.map((y) => (
            <Link
              key={y}
              href={href({ ano: String(y) }, props)}
              aria-current={ano === y ? "page" : undefined}
              className={[
                "pill tabular shrink-0 whitespace-nowrap px-4 py-1.5 text-[13px] transition-colors",
                ano === y
                  ? "afiado font-medium text-[var(--color-ink)]"
                  : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {y}
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className={`${INLINE} items-center gap-4`}>
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={href({ ordem: s.key }, props)}
              aria-current={s.key === sort ? "true" : undefined}
              className={[
                "shrink-0 whitespace-nowrap text-[13px] transition-colors",
                s.key === sort
                  ? "text-[var(--color-ink)] underline decoration-[var(--color-ink)] decoration-2 underline-offset-[6px]"
                  : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {s.label}
            </Link>
          ))}

          {/**
            * A DIREÇÃO, dita em palavra.
            *
            * "Ordenar por título" não diz nada sozinho: A a Z ou Z a A? A ordem
            * existia e a direção era um palpite do código, que a pessoa tinha que
            * descobrir olhando a lista.
            *
            * E o rótulo MUDA COM O CRITÉRIO: "crescente" não quer dizer nada para
            * uma data, e "A a Z" não quer dizer nada para um ano. A palavra certa é
            * a que descreve o que a pessoa vai ver.
            */}
          <Link
            href={href({ dir: inverso }, props)}
            aria-label={`inverter: ${DIRECAO_LABEL[sort][inverso]}`}
            className="ml-1 flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
          >
            {direcao === "asc" ? <ArrowUp size={13} strokeWidth={1.75} /> : <ArrowDown size={13} strokeWidth={1.75} />}
            {DIRECAO_LABEL[sort][direcao]}
          </Link>
        </div>

        {/* both views are first class: neither is "the real one" */}
        <div className="surface-2 flex shrink-0 p-0.5">
          {(["parede", "lista"] as const).map((v) => (
            <Link
              key={v}
              href={href({ vista: v }, props)}
              aria-current={v === view ? "true" : undefined}
              className={[
                "pill whitespace-nowrap px-3 py-1 text-[13px] font-medium",
                v === view
                  ? "bg-[color-mix(in_srgb,var(--color-ink)_12%,transparent)] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
              ].join(" ")}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
