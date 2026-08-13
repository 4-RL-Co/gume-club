"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, ChevronDown, ImagePlus, X } from "lucide-react";
import { origemAceita } from "@/lib/imagens";
import { Cover } from "@/components/cover";
import { porEmblemaAction } from "@/app/colecao/actions";
import type { Conjunto } from "@/lib/copies";

/**
 * ════════════════════════════════════════════════════════════════════
 *  UM CONJUNTO DA COLEÇÃO. Recolhido por padrão, e a grade só existe se você pedir.
 *
 *  ═══ O BUG QUE ESTE REDESIGN CONSERTA ═══
 *
 *  Cada conjunto era um cartão inteiro, sempre aberto: emblema, título, barra e a
 *  grade dos volumes, tudo de uma vez. Uma coleção de quinze conjuntos virava quinze
 *  cartões grandes empilhados — no perfil, ao lado de tudo mais que a pessoa é, isso
 *  é a coleção engolindo a página.
 *
 *  ═══ A REFERÊNCIA QUE RESOLVE ═══
 *
 *  Trocas de troféu (PSN, Xbox) resolvem exatamente este problema do mesmo jeito:
 *  cada jogo é uma LINHA compacta — emblema, nome, "X de Y" — e a grade inteira das
 *  conquistas só abre quando você clica. É o padrão que o dono trouxe de referência.
 *
 *  ═══ POR QUE O DE CIMA (A LINHA) NÃO PODE FICAR DESATUALIZADO ═══
 *
 *  A linha sozinha já precisa responder "estou perto?" sem abrir nada: por isso ela
 *  carrega a barra fina de progresso e o selo dourado de completo, os dois já visíveis
 *  fechada. Só a GRADE dos volumes (a lacuna, volume por volume) é que espera o clique.
 *
 *  ═══ O QUE NÃO MUDOU ═══
 *
 *  O que falta continua aparecendo em cinza dentro da grade — esconder a lacuna
 *  transformaria a tela num inventário do que você já tem, e a lacuna é o assunto de
 *  quem coleciona. O dourado continua sendo a única cor da tela, e só aparece completo.
 *  Ver ai/DECISIONS.md.
 *
 *  ═══ E A IMAGEM GANHOU UMA PORTA ═══
 *
 *  `porEmblema()` existia desde 2026-08-06 e não tinha formulário nenhum: a função
 *  funcionava, e continuava impossível de usar. Agora, dentro do conjunto aberto, dá
 *  para pôr (ou trocar) uma imagem — logotipo, símbolo, ou o personagem que o dono
 *  pediu — por endereço, como todo o resto deste app. Só quem está logado vê a porta:
 *  `podeEditar` é `false` para quem olha o perfil de outra pessoa sem ter entrado.
 * ════════════════════════════════════════════════════════════════════
 */
export function ConjuntoCard({
  c, podeEditar = true,
}: {
  c: Conjunto;
  /** Pôr um emblema é contribuição de catálogo (qualquer leitor logado pode); quem
      não entrou não vê o convite, porque salvar exigiria estar logado mesmo assim. */
  podeEditar?: boolean;
}) {
  /** Recolhido por padrão, sempre — sem exceção pra "o primeiro" ou "o mais
      completo". Uma regra só é mais fácil de não esquecer que duas. Ver ai/DECISIONS.md. */
  const [aberto, setAberto] = useState(false);
  const [editandoEmblema, setEditandoEmblema] = useState(false);
  const [url, setUrl] = useState(c.emblema ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const pct = c.total > 0 ? Math.round((c.tenho / c.total) * 100) : 0;

  const salvarEmblema = (novoUrl: string) => {
    setErro(null);
    start(async () => {
      try {
        await porEmblemaAction(c.id, novoUrl);
        setEditandoEmblema(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "não deu para salvar a imagem");
      }
    });
  };

  return (
    <section
      className="surface overflow-hidden"
      /* O conjunto completo ganha um fio dourado na borda — o mesmo dourado do selo,
         e a ÚNICA cor da tela. Quem completou merece que a moldura saiba. */
      style={c.completo ? { borderColor: "color-mix(in srgb, #d9a520 45%, transparent)" } : undefined}
    >
      <div className="flex w-full items-center gap-3 p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="flex min-w-0 flex-1 items-center gap-4 rounded-[var(--radius-2)] text-left transition-colors hover:bg-[color-mix(in_srgb,var(--color-ink)_3%,transparent)]"
        >
          {/* A CARA DA COLEÇÃO: o personagem principal (mangá), o retrato do autor
              (livro), ou o que um leitor pôs à mão. Por referência, nunca uma cópia
              do arquivo. Ver lib/imagens.ts.

              PREENCHE o círculo — era um ícone pequeno (28px) boiando dentro de um
              círculo de 44px, o desenho certo pra um LOGOTIPO. Uma foto de rosto
              apertada assim vira um selo ilegível. object-cover e o mesmo tamanho do
              círculo fazem a foto valer a pena sem precisar crescer: "não precisa ser
              grande, tá bom estando dentro do círculo se ficar bem visível."

              Completo ganha o anel dourado, a mesma cor do selo abaixo. */}
          {c.emblema && origemAceita(c.emblema) ? (
            <span
              className="surface-2 relative flex h-11 w-11 shrink-0 overflow-hidden rounded-full"
              style={c.completo
                ? { boxShadow: "0 0 0 2px color-mix(in srgb, #d9a520 70%, transparent)" }
                : undefined}
              aria-hidden
            >
              <Image
                src={c.emblema}
                alt=""
                fill
                sizes="44px"
                className={["object-cover", c.completo ? "" : "opacity-55 grayscale"].join(" ")}
              />
            </span>
          ) : (
            <span
              className="surface-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] text-[var(--color-ink-faint)]"
              aria-hidden
            >
              {c.tenho}/{c.total}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="voice truncate text-[17px] leading-snug text-[var(--color-ink)] sm:text-[19px]">
                {c.titulo}
              </h2>
            </div>
            <p className="mt-0.5 text-[12px] text-[var(--color-ink-faint)]">
              <span className="tabular">{c.tenho} de {c.total}</span>
              {c.publisher ? ` · ${c.publisher}` : ""}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: c.completo ? "#d9a520" : "var(--color-ink-soft)" }}
              />
            </div>
          </div>

          <ChevronDown
            size={16}
            strokeWidth={1.5}
            aria-hidden
            className={[
              "ml-1 shrink-0 text-[var(--color-ink-faint)] transition-transform duration-200",
              aberto ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>

        {/* A ÚNICA coisa dourada da tela, e a porta para a página de dentro da
            coleção — que só existe para quem chegou até aqui. Fora do botão que
            expande/recolhe, porque um link dentro de um botão é HTML inválido. */}
        {c.completo && (
          <Link
            href={`/colecao/${c.slug}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-control)] border px-2 py-1 text-[11px] font-medium transition-opacity hover:opacity-80"
            style={{ color: "#d9a520", borderColor: "#d9a520" }}
          >
            <Trophy size={11} strokeWidth={1.75} aria-hidden />
            completa
          </Link>
        )}
      </div>

      {aberto && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <ul className="flex flex-wrap gap-3">
            {c.volumes.map((v) => (
              <li key={v.slug} className="w-[84px] sm:w-[104px]">
                <Link href={`/livro/${v.slug}`} className="block" title={v.title}>
                  {/* O QUE FALTA CONTINUA NA TELA, apagado. É a lacuna que move quem
                      coleciona, e escondê-la devolveria a tela ao inventário. */}
                  <span
                    className={[
                      "cover-lift block transition-all duration-300",
                      v.tenho ? "" : "opacity-40 grayscale hover:opacity-70 hover:grayscale-0",
                    ].join(" ")}
                  >
                    <Cover title={v.title} src={v.coverUrl} />
                  </span>
                  <span
                    className={[
                      "tabular mt-1.5 block text-center text-[11px]",
                      v.tenho ? "text-[var(--color-ink-soft)]" : "text-[var(--color-ink-faint)]",
                    ].join(" ")}
                  >
                    {v.volume ?? "—"}
                    {/* Querer é diferente de não ter: o app sabe, e diz baixinho. */}
                    {!v.tenho && v.quero ? " ·" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {podeEditar && (
            <div className="mt-4 border-t border-[var(--color-rule)] pt-4">
              {editandoEmblema ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    autoFocus
                    disabled={pending}
                    className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => salvarEmblema(url)}
                    className="rounded-[var(--radius-control)] border border-[var(--color-rule)] px-3 py-2 text-[12px] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
                  >
                    salvar
                  </button>
                  {c.emblema && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => { setUrl(""); salvarEmblema(""); }}
                      className="text-[12px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-40"
                    >
                      tirar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setEditandoEmblema(false); setUrl(c.emblema ?? ""); setErro(null); }}
                    aria-label="fechar"
                  >
                    <X size={15} strokeWidth={1.5} className="text-[var(--color-ink-faint)]" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditandoEmblema(true)}
                  className="flex items-center gap-2 text-[12px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
                >
                  <ImagePlus size={13} strokeWidth={1.5} aria-hidden />
                  {c.emblema ? "trocar a imagem desta coleção" : "pôr uma imagem desta coleção"}
                </button>
              )}
              {erro && <p className="mt-2 text-[12px] text-[var(--color-perigo)]">{erro}</p>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
