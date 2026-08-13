"use client";

import { Search } from "lucide-react";
import { abrirBusca } from "@/components/sidebar";

/**
 * ════════════════════════════════════════════════════════════════════
 *  "NÃO ACHOU A SUA? BUSQUE UM LIVRO."
 *
 *  Uma coleção nasce de um livro: você diz que UM volume faz parte dela (e cria
 *  na hora, se ela ainda não existir) na própria ficha do livro — ver
 *  ConjuntoDoLivro, em components/tenho.tsx. Essa porta já existe e funciona,
 *  mas só aparece para quem já está na ficha certa. Quem chega em /colecao sem
 *  ainda ter marcado nenhum livro seu não tinha como adivinhar que o caminho
 *  começa ali.
 *
 *  Isto não é uma segunda busca: é o MESMO ⌘K, aberto por um botão em vez de um
 *  atalho de teclado. Ver a nota em components/sidebar.tsx.
 * ════════════════════════════════════════════════════════════════════
 */
export function ComecarColecao() {
  return (
    <button
      type="button"
      onClick={abrirBusca}
      className="mt-5 flex items-center gap-2 text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
    >
      <Search size={13} strokeWidth={1.5} aria-hidden />
      não achou a coleção que procura? busque um livro dela, e crie se ela ainda não existir
    </button>
  );
}
