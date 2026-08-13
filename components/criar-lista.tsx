"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DialogoLista } from "@/components/dialogo-lista";

/**
 * "CRIAR UMA LISTA" TAMBÉM PRECISA EXISTIR FORA DA COLUNA DA DESKTOP.
 *
 * O diálogo (components/dialogo-lista.tsx) só tinha uma porta:
 * components/my-shelves.tsx, que só existe dentro da coluna de vidro do
 * desktop (`components/sidebar.tsx`, escondida no celular). Quem está no
 * telefone não tinha como criar uma lista — não é bug NOVO desta rodada
 * (a estante inline de antes também só existia ali), mas é o tipo de coisa
 * que não aparece sozinha: sem botão quebrado, sem erro, só um caminho que
 * nunca existiu.
 *
 * `/listas` é uma tela normal, alcançável em qualquer tamanho — o lugar
 * certo pra segunda porta.
 */
export function CriarLista() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-6 flex items-center gap-1.5 text-[13px] text-[var(--color-ink-faint)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]"
      >
        <Plus size={13} strokeWidth={1.5} aria-hidden />
        criar uma lista
      </button>

      <DialogoLista open={aberto} onClose={() => setAberto(false)} />
    </>
  );
}
