import { IconeRedeSocial } from "@/components/icone-rede-social";
import { rotuloDoLink, urlValida } from "@/lib/links-sociais";

/**
 * OS LINKS DO PERFIL, no perfil de quem visita. Até 5, rotulados pelo
 * domínio — ver lib/links-sociais.ts. A versão editável mora em /perfil
 * (components/gerenciar-links.tsx).
 */
export function LinksDoPerfil({ links }: { links: string[] }) {
  const validos = links.filter((l) => urlValida(l));
  if (validos.length === 0) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
      {validos.map((l) => (
        <li key={l}>
          <a
            href={l}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex items-center gap-1.5 text-[13px] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
          >
            <IconeRedeSocial url={l} />
            {rotuloDoLink(l)}
          </a>
        </li>
      ))}
    </ul>
  );
}
