import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Cover } from "@/components/cover";
import { Avatar } from "@/components/avatar";
import type { ListaCard as Lista } from "@/lib/listas";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O CARD DE UMA ESTANTE INVENTADA. Capas em leque, nome, descrição, quem fez.
 *
 *  Antes, uma estante era uma pílula de texto com um número. Uma coleção montada
 *  com capricho merece aparecer como o que é: um pedaço de curadoria. O leque de
 *  capas sobrepostas diz "aqui tem livros escolhidos" antes de qualquer palavra,
 *  o nome e a descrição dizem o recorte, e o rosto diz quem montou, porque a
 *  recomendação de pessoa é o produto.
 *
 *  ═══ OS DOIS NÚMEROS DO RODAPÉ ═══
 *
 *  "12 livros" é o tamanho da curadoria. O marcador com o número ao lado é
 *  quantas pessoas GUARDARAM esta estante, e ele entrou em 2026-07-28, revertendo
 *  a regra antiga ("guardar nunca vira número") que este comentário defendia.
 *
 *  O argumento do dono, e ele está inteiro no cabeçalho de lib/listas.ts:
 *  guardar não é curtir. Curtir custa um toque; guardar é pôr a curadoria de
 *  outra pessoa dentro do seu perfil, assinada com o nome dela.
 *
 *  O que continua sem número nenhum é LEITURA: sem contador de seguidores,
 *  sem "12 pessoas leram este livro". O voto em resenha (lib/upvotes.ts) é a
 *  exceção deliberada — vale para a RESENHA, nunca para quem a escreveu, e
 *  nunca vira um placar de gente.
 *
 *  ═══ DOIS DESTINOS, DOIS LINKS IRMÃOS ═══
 *
 *  O card leva para a ESTANTE; o rodapé com o rosto leva para a PESSOA. Nunca um
 *  dentro do outro: link aninhado é HTML inválido, e é a mesma regra do card de
 *  livro e da tira de amigos lendo.
 * ════════════════════════════════════════════════════════════════════
 */
export function ListaCardVis({ lista, mostrarDono = true }: { lista: Lista; mostrarDono?: boolean }) {
  const n = lista.capas.length;

  return (
    <div className="card group relative flex h-full flex-col p-5">
      <Link
        href={`/estante/${lista.slug}`}
        className="block"
        aria-label={lista.name}
      >
        {/* O leque. As capas se sobrepõem da esquerda para a direita, a primeira por
            cima: é a primeira que define a cara da estante, como no cartaz de um
            cinema. Altura fixa para os cards baterem na grade. */}
        {/* .leque: no hover do card as capas se afastam um dedo, como quem folheia.
            Ver globals.css. */}
        <span className="leque flex h-32 items-stretch overflow-hidden rounded-[var(--radius-cover)]">
          {lista.capas.map((capa, i) => (
            <span
              key={i}
              className="relative block h-full w-[22%] shrink-0 overflow-hidden"
              style={{
                marginLeft: i === 0 ? 0 : "-2%",
                zIndex: n - i,
                borderRadius: "var(--radius-cover)",
                boxShadow: "2px 0 8px rgba(0,0,0,0.35)",
              }}
            >
              <Cover title={capa.title} author={capa.author} src={capa.coverUrl} />
            </span>
          ))}
          {n === 0 && (
            <span className="flex h-full w-full items-center justify-center rounded-[var(--radius-cover)] bg-[var(--surface-2)] text-[12px] text-[var(--color-ink-faint)]">
              ainda sem livros
            </span>
          )}
        </span>

        <span className="voice mt-4 block text-[17px] leading-snug text-[var(--color-ink)]">
          {lista.name}
          {lista.ranked && (
            <span className="tabular ml-2 align-middle text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              em ordem
            </span>
          )}
        </span>

        {lista.description && (
          <span className="mt-1.5 line-clamp-2 block text-[13px] leading-relaxed text-[var(--color-ink-soft)]">
            {lista.description}
          </span>
        )}
      </Link>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {mostrarDono ? (
          <Link
            href={`/@${lista.dono.handle}`}
            className="flex min-w-0 items-center gap-2 text-[12px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            <Avatar
              src={lista.dono.image}
              name={lista.dono.name}
              handle={lista.dono.handle}
              size={20}
            />
            <span className="truncate">de {lista.dono.name ?? lista.dono.handle}</span>
          </Link>
        ) : (
          <span />
        )}
        <span className="flex shrink-0 items-center gap-3 text-[12px] text-[var(--color-ink-faint)]">
          {/* ═══ QUANTOS GUARDARAM ═══

              O marcador só aparece quando alguém guardou. Um "0" em toda estante
              nova diz a quem acabou de montar a dela que ninguém quis, e essa é a
              primeira coisa que a pessoa leria depois de uma hora de trabalho.
              Zero não é informação aqui: é um comentário.

              Ver o cabeçalho de lib/listas.ts para por que este número existe, e
              por que ele não é o mesmo que uma curtida. */}
          {lista.guardadas > 0 && (
            <span className="tabular flex items-center gap-1" title="quantas pessoas guardaram">
              <Bookmark size={12} strokeWidth={1.5} aria-hidden />
              {lista.guardadas}
            </span>
          )}
          <span className="tabular">
            {lista.livros === 1 ? "1 livro" : `${lista.livros} livros`}
          </span>
        </span>
      </div>
    </div>
  );
}

/** A grade de cards. Quem chama decide o título da seção; isto só arruma. */
export function ListaGrid({ listas, mostrarDono = true }: { listas: Lista[]; mostrarDono?: boolean }) {
  if (listas.length === 0) return null;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listas.map((l) => (
        <li key={l.id}>
          <ListaCardVis lista={l} mostrarDono={mostrarDono} />
        </li>
      ))}
    </ul>
  );
}
