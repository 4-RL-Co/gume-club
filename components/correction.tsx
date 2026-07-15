"use client";

import { useState, useTransition } from "react";
import { corrigir, proporUmaCapa } from "@/app/livro/[slug]/correction-actions";
import { toast } from "@/lib/toast";
import { CAMPOS, type Campo } from "@/lib/corrections-view";
import { porQueNaoAceita, DE_ONDE_ACEITA } from "@/lib/imagens";
import { LIMITS } from "@/lib/limits";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A TELA DE CORREÇÃO PERGUNTA PRIMEIRO, E A PERGUNTA É A FEATURE.
 *
 *  Sobrescrever a edição compartilhada para ela bater com a SUA cópia é
 *  proibido. Capa diferente é EDIÇÃO diferente. Foi exatamente assim que
 *  o catálogo do Goodreads virou lixo: cada leitor foi ajustando a ficha
 *  comum até ela não descrever livro nenhum.
 *
 *  Então, antes de deixar alguém editar qualquer coisa, a tela pergunta
 *  o que está errado, e empurra para o caminho certo:
 *
 *    1. um DADO desta edição está errado    → corrige, e aplica na hora
 *    2. a MINHA edição é outra              → escolher/criar outra edição
 *    3. eu só quero mostrar a MINHA cópia   → foto da sua cópia, e a
 *                                             ficha comum não é tocada
 * ════════════════════════════════════════════════════════════════════
 */
type Edicao = { id: string; publisher: string | null; publishedYear: number | null };

export function Correcao({
  slug,
  edicao,
  temOutrasEdicoes,
}: {
  slug: string;
  edicao: Edicao;
  temOutrasEdicoes: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [caminho, setCaminho] = useState<null | "dado" | "capa">(null);
  const [campo, setCampo] = useState<Campo>("pageCount");
  const [capa, setCapa] = useState("");
  const [recusa, setRecusa] = useState<string | null>(null);
  const [naoCarregou, setNaoCarregou] = useState(false);
  const [pending, start] = useTransition();

  const fechar = () => {
    setAberto(false);
    setCaminho(null);
  };

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
      >
        Tem algo errado nesta ficha?
      </button>
    );
  }

  return (
    <div className="surface-2 mt-4 p-5">
      {!caminho ? (
        <>
          <h3 className="text-[15px] text-[var(--color-ink)]">O que está errado?</h3>

          <div className="mt-5 flex flex-col gap-2">
            <Escolha onClick={() => setCaminho("dado")}>
              Um dado desta edição está errado
              <Sub>páginas, ano, editora, ISBN, tradutor, formato, idioma</Sub>
            </Escolha>

            <Escolha onClick={() => setCaminho("capa")}>
              A capa está errada, ou não tem capa
              <Sub>você sugere, e um bibliotecário confere antes de entrar</Sub>
            </Escolha>

            {/*
              O caminho 2 e o 3 NÃO editam a ficha comum, e é por isso que eles
              existem: é para cá que a maioria das pessoas deveria ir, e é o
              caminho que os outros apps não oferecem, então todo mundo acaba
              estragando a ficha compartilhada por falta de alternativa.
            */}
            <Escolha href={temOutrasEdicoes ? "#edicoes" : undefined} onClick={fechar}>
              A minha edição é outra, diferente desta
              <Sub>
                então não é uma correção: escolha a sua edição na lista abaixo, ou cadastre ela.
                Capa diferente é edição diferente.
              </Sub>
            </Escolha>

            <Escolha href="#minha-copia" onClick={fechar}>
              Nada. Eu só quero mostrar a minha cópia
              <Sub>a foto do seu exemplar, com a orelha rasgada e tudo. A ficha comum não muda.</Sub>
            </Escolha>
          </div>

          <button
            onClick={fechar}
            className="mt-5 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            deixa
          </button>
        </>
      ) : caminho === "dado" ? (
        <form
          action={(data: FormData) =>
            start(async () => {
              try {
                await corrigir(
                  slug,
                  edicao.id,
                  campo,
                  String(data.get("valor") ?? ""),
                  String(data.get("motivo") ?? ""),
                );
                toast("Corrigido. O seu nome fica no histórico.");
                fechar();
              } catch {
                toast("Não deu para gravar a correção.");
              }
            })
          }
        >
          <h3 className="text-[15px] text-[var(--color-ink)]">Corrigir um dado desta edição</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
            Vale na hora, para todo mundo, e fica gravado com o seu nome.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {(Object.keys(CAMPOS) as Campo[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCampo(c)}
                aria-pressed={campo === c}
                className={[
                  "pill border px-3 py-1.5 text-[13px]",
                  campo === c
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-canvas)]"
                    : "border-[var(--color-rule)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)]",
                ].join(" ")}
              >
                {CAMPOS[c].label}
              </button>
            ))}
          </div>

          <input
            name="valor"
            autoFocus
            maxLength={LIMITS.title}
            placeholder={`o ${CAMPOS[campo].label} correto`}
            className="mt-4 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)]"
          />
          <input
            name="motivo"
            maxLength={LIMITS.note}
            placeholder="onde você viu isso? (opcional)"
            className="mt-2 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--color-ink)]"
          />

          <div className="mt-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
            >
              {pending ? "corrigindo" : "corrigir"}
            </button>
            <button type="button" onClick={() => setCaminho(null)} className="text-[13px] text-[var(--color-ink-faint)]">
              voltar
            </button>
          </div>
        </form>
      ) : (
        <form
          action={(data: FormData) =>
            start(async () => {
              // A ação DEVOLVE a recusa: o Next apaga a mensagem de um erro lançado numa
              // ação de servidor em produção, e a pessoa ficaria sem saber o que fazer.
              const { erro } = await proporUmaCapa(
                slug,
                edicao.id,
                String(data.get("url") ?? ""),
                String(data.get("nota") ?? ""),
              );
              if (erro) {
                setRecusa(erro);
                return;
              }
              toast("Sugestão enviada. Um bibliotecário confere.");
              fechar();
            })
          }
        >
          <h3 className="text-[15px] text-[var(--color-ink)]">Sugerir uma capa</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
            A capa é a única coisa que um bibliotecário confere antes de entrar, porque ela aparece
            na tela de todo mundo. O endereço de uma imagem na internet, e não um arquivo: a capa
            mora na fonte — por isso ela só pode vir de {DE_ONDE_ACEITA.join(", ")}.
          </p>

          <input
            name="url"
            autoFocus
            value={capa}
            maxLength={LIMITS.url}
            onChange={(e) => {
              setCapa(e.target.value);
              setRecusa(porQueNaoAceita(e.target.value));
              setNaoCarregou(false);
            }}
            placeholder="https://upload.wikimedia.org/…"
            className="mt-4 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none focus:border-[var(--color-ink)]"
          />

          {recusa && (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-perigo)]" aria-live="polite">
              {recusa}
            </p>
          )}

          {/* A PRÉVIA. Um endereço pode passar pela conferência de origem e ainda assim
              não ser uma imagem — o link para a PÁGINA da foto, em vez do link para o
              ARQUIVO, é o erro mais comum que existe, e é o que dá capa quebrada. Só o
              navegador sabe disso, então a gente pede para ele carregar e escuta. */}
          {capa.trim() && !recusa && (
            <div className="mt-3 flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={capa}
                src={capa.trim()}
                alt=""
                onError={() => setNaoCarregou(true)}
                onLoad={() => setNaoCarregou(false)}
                className="h-28 w-20 shrink-0 rounded-[var(--radius-2)] border border-[var(--color-rule)] object-cover"
              />
              <p
                className={[
                  "text-[13px] leading-relaxed",
                  naoCarregou ? "text-[var(--color-perigo)]" : "text-[var(--color-ink-faint)]",
                ].join(" ")}
                aria-live="polite"
              >
                {naoCarregou
                  ? "Esse endereço não abriu como imagem. Copie o endereço do ARQUIVO da imagem, e não o da página onde ela aparece."
                  : "É esta a capa que o bibliotecário vai ver."}
              </p>
            </div>
          )}

          <input
            name="nota"
            maxLength={LIMITS.note}
            placeholder="de onde veio essa imagem? (opcional)"
            className="mt-2 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--color-ink)]"
          />

          <div className="mt-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={pending || !!recusa || naoCarregou || !capa.trim()}
              className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
            >
              {pending ? "enviando" : "sugerir"}
            </button>
            <button type="button" onClick={() => setCaminho(null)} className="text-[13px] text-[var(--color-ink-faint)]">
              voltar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Escolha({
  children, onClick, href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const classe =
    "surface w-full rounded-[var(--radius-2)] p-4 text-left text-[14px] text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink)]";

  return href ? (
    <a href={href} onClick={onClick} className={classe}>
      {children}
    </a>
  ) : (
    <button onClick={onClick} className={classe}>
      {children}
    </button>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <span className="mt-1.5 block text-[12px] leading-relaxed text-[var(--color-ink-faint)]">
      {children}
    </span>
  );
}
