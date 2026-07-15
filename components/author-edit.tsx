"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { CAMPOS_AUTOR, type CampoAutor } from "@/lib/corrections-view";
import { corrigir, trocarRetrato } from "@/app/autor/[slug]/actions";
import { porQueNaoAceita, DE_ONDE_ACEITA } from "@/lib/imagens";
import { LIMITS } from "@/lib/limits";
import { Campo } from "@/components/campo";
import { toast } from "@/lib/toast";

/**
 * ════════════════════════════════════════════════════════════════════
 *  CORRIGIR A FICHA DE UM AUTOR.
 *
 *  O nome vem do dump da Open Library escrito de qualquer jeito
 *  ("Machado De ASSIS"), a nacionalidade está quase toda vazia, e não
 *  havia como um leitor arrumar nada disso: a EDIÇÃO era corrigível
 *  desde a fatia 1, e o AUTOR não era, sem motivo nenhum.
 *
 *  ═══ NÃO PEDE PERMISSÃO, E ISSO É O DESENHO ═══
 *
 *  Toda correção grava uma revisão com o NOME de quem fez, pública e
 *  para sempre. É a ASSINATURA, e não a permissão, que torna o
 *  vandalismo caro: a permissão só adia o vandalismo, e a assinatura o
 *  encarece.
 *
 *  O RETRATO é a exceção, e só bibliotecário troca. Mesma regra da capa,
 *  pelo mesmo motivo: imagem é o único campo que aparece na tela de todo
 *  mundo, e é o único onde o vandalismo tem plateia.
 *
 *  ═══ E ELE NÃO FINGE MAIS QUE DEU CERTO ═══
 *
 *  Duas coisas quebravam aqui em silêncio, e as duas eram a mesma coisa: o
 *  formulário aceitava, dizia "Arrumado. Obrigado.", e o que ficou gravado
 *  não era o que a pessoa tinha pedido.
 *
 *  1. O RETRATO. Colava-se o endereço de uma imagem de qualquer site, ele
 *     era gravado, e a CSP o bloqueava na hora de mostrar — imagem quebrada
 *     na página do autor, para todo mundo, e ninguém sabendo por quê. Agora
 *     a origem é conferida na hora de colar, a recusa DIZ de onde o app
 *     aceita, e a prévia mostra a foto antes de salvar.
 *
 *  2. A BIO. Colava-se um parágrafo e o servidor o cortava no caractere 280
 *     sem avisar. Agora o campo trava, e a contagem está à vista.
 * ════════════════════════════════════════════════════════════════════
 */
export function AuthorEdit({
  authorId,
  slug,
  atual,
  bibliotecario,
}: {
  authorId: string;
  slug: string;
  atual: Record<string, string | null>;
  bibliotecario: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [campo, setCampo] = useState<CampoAutor | "retrato">("nationality");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [recusa, setRecusa] = useState<string | null>(null);
  const [naoCarregou, setNaoCarregou] = useState(false);
  const [pendente, comecar] = useTransition();

  function escolher(c: CampoAutor | "retrato") {
    setCampo(c);
    setRecusa(null);
    setNaoCarregou(false);
    setValor(c === "retrato" ? (atual.imageUrl ?? "") : (atual[c] ?? ""));
  }

  /**
   * A conferência do endereço acontece A CADA TECLA, e não no envio.
   *
   * E ela chama a MESMA função que o servidor chama (`lib/imagens.ts`). A tela e o
   * servidor discordarem sobre o que é um endereço aceito seria trocar um bug silencioso
   * por outro: a pessoa veria "pode", clicaria, e levaria um "não pode".
   */
  function digitarRetrato(v: string) {
    setValor(v);
    setRecusa(porQueNaoAceita(v));
    setNaoCarregou(false);
  }

  /** Só faz sentido tentar mostrar o que passou pela conferência de origem. */
  const previa = campo === "retrato" && valor.trim() && !recusa ? valor.trim() : null;

  if (!aberto) {
    return (
      <button
        onClick={() => {
          setAberto(true);
          escolher("nationality");
        }}
        className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
      >
        <Pencil size={14} strokeWidth={1.5} />
        arrumar esta ficha
      </button>
    );
  }

  return (
    <section className="surface mt-6 p-6 sm:p-7">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        o que está errado?
      </h2>

      {/* A PERGUNTA VEM ANTES DA EDIÇÃO, e ela é a feature: escolher o campo obriga a
          pessoa a dizer o que ela viu de errado, em vez de sobrescrever o que der. */}
      <div className="mt-5 flex flex-wrap gap-2">
        {(Object.keys(CAMPOS_AUTOR) as CampoAutor[]).map((c) => (
          <button
            key={c}
            onClick={() => escolher(c)}
            className={[
              "pill px-4 py-1.5 text-[13px] transition-colors",
              campo === c
                ? "afiado font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            {CAMPOS_AUTOR[c].label}
          </button>
        ))}

        {bibliotecario && (
          <button
            onClick={() => escolher("retrato")}
            className={[
              "pill px-4 py-1.5 text-[13px] transition-colors",
              campo === "retrato"
                ? "afiado font-medium text-[var(--color-ink)]"
                : "text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]",
            ].join(" ")}
          >
            retrato
          </button>
        )}
      </div>

      <div className="mt-5">
        {campo === "bio" ? (
          <Campo
            valor={valor}
            aoMudar={setValor}
            teto={LIMITS.authorBio}
            linhas={7}
            placeholder="Quem foi essa pessoa, em um parágrafo. Escrito por você, e não por uma máquina."
          />
        ) : campo === "retrato" ? (
          <input
            value={valor}
            maxLength={LIMITS.url}
            onChange={(e) => digitarRetrato(e.target.value)}
            placeholder="https://upload.wikimedia.org/..."
            className="w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[15px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />
        ) : (
          <Campo valor={valor} aoMudar={setValor} teto={LIMITS.author} />
        )}
      </div>

      {campo === "retrato" && (
        <div className="mt-4">
          {recusa ? (
            <p className="text-[13px] leading-relaxed text-[var(--color-perigo)]" aria-live="polite">
              {recusa}
            </p>
          ) : (
            <p className="text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
              O endereço da imagem, e não uma cópia dela. O retrato mora na fonte, e a gente guarda
              o caminho até lá — por isso ele só pode vir de {DE_ONDE_ACEITA.join(", ")}.
            </p>
          )}

          {/**
           * ═══ A PRÉVIA, E O QUE SÓ ELA RESOLVE ═══
           *
           * Um endereço pode passar pela conferência de origem e mesmo assim não ser uma
           * imagem: o link para a PÁGINA da foto no Commons, em vez do link para o
           * ARQUIVO, é o erro mais comum que existe — e é exatamente o que produz uma
           * imagem quebrada.
           *
           * Nenhuma conferência de texto sabe disso. O navegador sabe. Então a gente pede
           * para ele carregar a imagem aqui, e o `onError` fala antes de gravar.
           */}
          {previa && (
            <div className="mt-4 flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={previa}
                src={previa}
                alt=""
                onError={() => setNaoCarregou(true)}
                onLoad={() => setNaoCarregou(false)}
                className="h-24 w-24 shrink-0 rounded-[var(--radius-2)] border border-[var(--color-rule)] object-cover"
              />
              <p
                className={[
                  "text-[13px] leading-relaxed",
                  naoCarregou ? "text-[var(--color-perigo)]" : "text-[var(--color-ink-faint)]",
                ].join(" ")}
                aria-live="polite"
              >
                {naoCarregou
                  ? "Esse endereço não abriu como imagem. No Wikimedia Commons, o endereço da " +
                    "página da foto não serve: clique na foto, depois em “Mais detalhes”, e copie " +
                    "o endereço do arquivo, que termina em .jpg ou .png."
                  : "É esta a foto que vai aparecer na página. Se estiver certa, pode arrumar."}
              </p>
            </div>
          )}
        </div>
      )}

      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        maxLength={LIMITS.note}
        placeholder="onde você viu isso? (opcional)"
        className="mt-4 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
      />

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          disabled={pendente || (campo === "retrato" && (!!recusa || naoCarregou))}
          onClick={() =>
            comecar(async () => {
              try {
                if (campo === "retrato") {
                  // A ação DEVOLVE a recusa, e não a lança: o Next apaga a mensagem de um
                  // erro lançado dentro de uma ação de servidor quando o app roda em
                  // produção, e a pessoa levaria um "não deu" sem motivo nenhum.
                  const { erro } = await trocarRetrato(authorId, slug, valor, motivo);
                  if (erro) {
                    setRecusa(erro);
                    return;
                  }
                } else {
                  await corrigir(authorId, slug, campo, valor, motivo);
                }
                toast("Arrumado. Obrigado.");
                setAberto(false);
                setMotivo("");
              } catch {
                toast("Não deu para arrumar agora.");
              }
            })
          }
          className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
        >
          {pendente ? "arrumando" : "Arrumar"}
        </button>

        <button
          onClick={() => setAberto(false)}
          className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
        >
          deixa
        </button>
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
        Não precisa pedir permissão a ninguém. O que você arrumar fica gravado com o seu nome
        aqui, e é isso que segura esta ficha.
      </p>
    </section>
  );
}
