import {
  siInstagram, siX, siBluesky, siThreads, siYoutube, siTiktok, siGithub,
  siGoodreads, siLetterboxd, siFacebook, siTwitch, siDiscord, siPinterest,
  siReddit, siMedium, siSubstack,
} from "simple-icons";
import { Link2 } from "lucide-react";
import { slugDoLink } from "@/lib/links-sociais";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O ÍCONE DE CADA REDE. "não achei nenhum ícone bonitinho" — o dono.
 *
 *  O lucide-react (o único pacote de ícone que o Gume já tinha) não desenha
 *  marca nenhuma — Instagram, X, GitHub, todos vêm `undefined` na versão
 *  instalada. simple-icons é o pacote certo pra isso: um desenho por marca,
 *  licença livre (CC0/MIT conforme a marca, ver DISCLAIMER.md do pacote),
 *  export nomeado por ícone (`sideEffects: false`), então importar só os que
 *  o Gume usa não pesa no pacote final — o resto de milhares de marcas nunca
 *  entra no bundle.
 *
 *  ═══ A COR NÃO VEM DA MARCA ═══
 *
 *  simple-icons também dá o hex oficial de cada logo, e ele fica no chão de
 *  propósito. "A ÚNICA coisa colorida no Gume é a capa de um livro" (ver
 *  components/veredito.tsx) — um perfil com o rosa do Instagram do lado do
 *  azul do Bluesky do lado do preto do X vira confete, e rouba a atenção que
 *  é da capa. O DESENHO de cada marca entra; a COR de cada marca, não —
 *  currentColor, a mesma tinta neutra de todo ícone do app.
 * ════════════════════════════════════════════════════════════════════
 */
const ICONES: Record<string, { path: string; title: string }> = {
  instagram: siInstagram,
  x: siX,
  bluesky: siBluesky,
  threads: siThreads,
  youtube: siYoutube,
  tiktok: siTiktok,
  github: siGithub,
  goodreads: siGoodreads,
  letterboxd: siLetterboxd,
  facebook: siFacebook,
  twitch: siTwitch,
  discord: siDiscord,
  pinterest: siPinterest,
  reddit: siReddit,
  medium: siMedium,
  substack: siSubstack,
};

/** O desenho da marca quando o Gume tem um; `Link2` genérico quando não tem. */
export function IconeRedeSocial({ url, size = 13 }: { url: string; size?: number }) {
  const slug = slugDoLink(url);
  const icone = slug ? ICONES[slug] : undefined;

  if (!icone) return <Link2 size={size} strokeWidth={1.75} aria-hidden />;

  return (
    <svg
      role="img"
      aria-hidden
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
    >
      <path d={icone.path} />
    </svg>
  );
}
