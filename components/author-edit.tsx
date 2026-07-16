"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { salvarAutor, trocarRetrato, fundir } from "@/app/autor/[slug]/actions";
import { porQueNaoAceita, DE_ONDE_ACEITA } from "@/lib/imagens";
import { LIMITS } from "@/lib/limits";
import { Campo } from "@/components/campo";
import { toast } from "@/lib/toast";
import type { Homonimo } from "@/lib/corrections";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ARRUMAR A FICHA DE UM AUTOR. Tudo à vista, e uma salvada só.
 *
 *  ═══ OS DOIS BUGS QUE ESTA TELA TINHA ═══
 *
 *  1. Ela pedia UM CAMPO POR VEZ, em pastilhas, e trocar de pastilha APAGAVA o que você
 *     tinha digitado. Arrumar nome e nacionalidade eram duas viagens, e ninguém
 *     descobria isso antes de perder o texto. A "pergunta antes da edição" era elegante
 *     no papel e cobrava um pedágio a cada campo.
 *
 *  2. Arrumar o NOME simplesmente estourava, e a tela dizia "não deu para arrumar
 *     agora". `authors.name` é único, o dump guarda a mesma pessoa escrita de seis
 *     jeitos ("Oswaldo França Júnior", "Oswaldo Franca Junior"...), e normalizar um
 *     deles colide com a forma certa que já existe. São 7.887 nomes assim: o motivo
 *     número um para arrumar um nome era exatamente o que o app não deixava fazer.
 *
 *  ═══ E A RESPOSTA PARA O SEGUNDO NÃO É UM ERRO MELHOR ═══
 *
 *  É entender o que a pessoa está dizendo. Arrumar o nome de um duplicado não é
 *  RENOMEAR: é dizer "estes dois são a mesma pessoa". Então a tela pergunta — "já
 *  existe um Oswaldo França Júnior com 12 livros, são o mesmo?" — e funde.
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
  const [nome, setNome] = useState(atual.name ?? "");
  const [nacionalidade, setNacionalidade] = useState(atual.nationality ?? "");
  const [bio, setBio] = useState(atual.bio ?? "");
  const [retrato, setRetrato] = useState("");
  const [motivo, setMotivo] = useState("");
  const [recusa, setRecusa] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [naoCarregou, setNaoCarregou] = useState(false);
  const [homonimo, setHomonimo] = useState<Homonimo | null>(null);
  const [pendente, comecar] = useTransition();

  function digitarRetrato(v: string) {
    setRetrato(v);
    setNaoCarregou(false);
    setRecusa(v.trim() ? porQueNaoAceita(v) : null);
  }

  const previa = retrato.trim() && !recusa ? retrato.trim() : null;

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
      >
        <Pencil size={14} strokeWidth={1.5} />
        arrumar esta ficha
      </button>
    );
  }

  /**
   * ═══ A PERGUNTA DA FUSÃO ═══
   *
   * Ela toma a tela inteira de propósito: juntar dois autores move os livros de um para
   * o outro, e isso aparece na estante de todo mundo. Uma decisão dessas não cabe num
   * aviso de canto que a pessoa aceita sem ler.
   */
  if (homonimo) {
    return (
      <section className="surface mt-6 p-6 sm:p-7">
        <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          são a mesma pessoa?
        </h2>

        <p className="voice mt-4 text-[17px] leading-snug text-[var(--color-ink)]">
          Já existe um {homonimo.name}, com {homonimo.livros}{" "}
          {homonimo.livros === 1 ? "livro" : "livros"}.
        </p>

        <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-[var(--color-ink-soft)]">
          O catálogo veio com a mesma pessoa escrita de vários jeitos. Se são o mesmo autor, o
          Gume junta os dois: os livros daqui passam para lá, e o nome de agora vira um apelido,
          para quem procurar pela grafia antiga continuar achando.
        </p>

        {erro && (
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-perigo)]" aria-live="polite">
            {erro}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-5">
          <button
            disabled={pendente}
            onClick={() =>
              comecar(async () => {
                setErro(null);
                const { erro: e } = await fundir(authorId, homonimo.id, slug, motivo);
                if (e) {
                  setErro(e);
                  return;
                }
                toast("Juntados. Agora são um autor só.");
                setHomonimo(null);
                setAberto(false);
              })
            }
            className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-5 py-2.5 text-[14px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
          >
            {pendente ? "juntando" : "Sim, são o mesmo"}
          </button>

          <button
            onClick={() => {
              setHomonimo(null);
              setErro(null);
            }}
            className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            não, são pessoas diferentes
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="surface mt-6 p-6 sm:p-7">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        arrumar esta ficha
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
        Arrume o que estiver errado e salve uma vez só.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <Rotulo>nome</Rotulo>
          <input
            value={nome}
            maxLength={LIMITS.author}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1.5 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[15px] outline-none focus:border-[var(--color-ink)]"
          />
        </label>

        <label className="block">
          <Rotulo>nacionalidade</Rotulo>
          <input
            value={nacionalidade}
            maxLength={LIMITS.author}
            onChange={(e) => setNacionalidade(e.target.value)}
            className="mt-1.5 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[15px] outline-none focus:border-[var(--color-ink)]"
          />
        </label>
      </div>

      <div className="mt-4">
        <Rotulo>quem é</Rotulo>
        <div className="mt-1.5">
          <Campo
            valor={bio}
            aoMudar={setBio}
            teto={LIMITS.authorBio}
            linhas={7}
            placeholder="Quem foi essa pessoa, em um parágrafo. Escrito por você, e não por uma máquina."
          />
        </div>
      </div>

      {/* O RETRATO é só de bibliotecário: imagem é o único campo onde o vandalismo tem
          plateia. E ele salva por conta própria, porque a regra dele é outra. */}
      {bibliotecario && (
        <div className="mt-5 border-t border-[var(--color-rule)] pt-5">
          <Rotulo>retrato</Rotulo>
          <input
            value={retrato}
            maxLength={LIMITS.url}
            onChange={(e) => digitarRetrato(e.target.value)}
            placeholder="https://upload.wikimedia.org/..."
            className="mt-1.5 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[15px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
          />

          {recusa ? (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-perigo)]" aria-live="polite">
              {recusa}
            </p>
          ) : (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-faint)]">
              O endereço da imagem, e não uma cópia dela. Ele só pode vir de{" "}
              {DE_ONDE_ACEITA.join(", ")}.
            </p>
          )}

          {/**
           * A PRÉVIA, e o que só ela resolve: um endereço pode passar pela conferência de
           * origem e mesmo assim não ser uma imagem. O link para a PÁGINA da foto no
           * Commons, em vez do link para o ARQUIVO, é o erro mais comum que existe.
           * Nenhuma conferência de texto sabe disso. O navegador sabe.
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
                  : "É esta a foto que vai aparecer na página."}
              </p>
            </div>
          )}

          {retrato.trim() && !recusa && !naoCarregou && (
            <button
              type="button"
              disabled={pendente}
              onClick={() =>
                comecar(async () => {
                  const { erro: e } = await trocarRetrato(authorId, slug, retrato, motivo);
                  if (e) {
                    setRecusa(e);
                    return;
                  }
                  toast("Retrato trocado.");
                  setRetrato("");
                })
              }
              className="mt-4 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-4 py-2 text-[13px] text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
            >
              trocar o retrato
            </button>
          )}
        </div>
      )}

      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        maxLength={LIMITS.note}
        placeholder="onde você viu isso? (opcional)"
        className="mt-5 w-full rounded-[var(--radius-2)] border border-[var(--color-rule)] bg-[var(--surface-2)] p-3 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)]"
      />

      {erro && (
        <p className="mt-4 text-[13px] leading-relaxed text-[var(--color-perigo)]" aria-live="polite">
          {erro}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <button
          disabled={pendente}
          onClick={() =>
            comecar(async () => {
              setErro(null);
              const r = await salvarAutor(
                authorId,
                slug,
                { name: nome, nationality: nacionalidade, bio },
                motivo,
              );

              if ("homonimo" in r) {
                setHomonimo(r.homonimo);
                return;
              }
              if ("erro" in r) {
                setErro(r.erro);
                return;
              }

              toast("Arrumado. Obrigado.");
              setAberto(false);
              setMotivo("");
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

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
      {children}
    </span>
  );
}
