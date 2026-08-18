"use client";

import { useState, useTransition } from "react";
import { X, Plus } from "lucide-react";
import { saveSocialLinks } from "@/app/perfil/actions";
import { rotuloDoLink, urlValida } from "@/lib/links-sociais";

/**
 * OS LINKS DO PERFIL. Até 5 URLs, texto livre — sem "qual rede social?".
 * "não achei onde colocar rede social" — o dono. Ver lib/links-sociais.ts
 * (o rótulo se decide olhando o domínio) e components/links-do-perfil.tsx
 * (como aparece pra quem visita).
 */
export function GerenciarLinks({ links: iniciais }: { links: string[] }) {
  const [links, setLinks] = useState(iniciais);
  const [novo, setNovo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const salvar = (proximos: string[]) => {
    setErro(null);
    start(async () => {
      const r = await saveSocialLinks(proximos);
      if (r.ok) {
        setLinks(proximos);
      } else {
        setErro(r.error);
      }
    });
  };

  const adicionar = () => {
    const url = novo.trim();
    if (!url) return;
    if (!urlValida(url)) {
      setErro(`isso não parece um link: "${url}"`);
      return;
    }
    if (links.length >= 5) {
      setErro("no máximo 5 links. Tire um antes de pôr outro.");
      return;
    }
    setNovo("");
    salvar([...links, url]);
  };

  const tirar = (url: string) => {
    salvar(links.filter((l) => l !== url));
  };

  return (
    <div>
      {links.length > 0 && (
        <ul className="flex flex-col gap-2">
          {links.map((l) => (
            <li key={l} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--color-ink-soft)]">
                <span className="text-[var(--color-ink)]">{rotuloDoLink(l)}</span>
                <span className="ml-2 text-[12px] text-[var(--color-ink-faint)]">{l}</span>
              </span>
              <button
                type="button"
                aria-label={`tirar ${l}`}
                disabled={pending}
                onClick={() => tirar(l)}
                className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-perigo)] disabled:opacity-40"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {links.length < 5 && (
        <div className={links.length > 0 ? "mt-4 flex gap-2" : "flex gap-2"}>
          <input
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adicionar(); } }}
            placeholder="https://instagram.com/voce"
            disabled={pending}
            className="min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-rule)] bg-transparent px-3 py-2 text-[14px] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-ink)] disabled:opacity-40"
          />
          <button
            type="button"
            disabled={pending || !novo.trim()}
            onClick={adicionar}
            className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--color-rule)] px-3 py-2 text-[13px] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] disabled:opacity-40"
          >
            <Plus size={14} strokeWidth={1.75} />
            adicionar
          </button>
        </div>
      )}

      {erro && <p className="mt-2 text-[13px] text-[var(--color-perigo)]">{erro}</p>}
    </div>
  );
}
