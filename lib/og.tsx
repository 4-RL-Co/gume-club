import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PÔSTER. A imagem que um link do Gume vira quando cai no WhatsApp.
 *
 *  Este é o ÚNICO canal de crescimento que o app tem. Não há anúncio,
 *  não há feed algorítmico, não há convite em escassez: alguém manda a
 *  estante para um amigo, e o amigo abre. Se o que chega é um retângulo
 *  cinza com uma URL, o amigo não abre, e o canal não existe.
 *
 *  ═══ A CAPA É A IMAGEM ═══
 *
 *  A única coisa colorida no Gume é a capa de um livro, e num pôster
 *  isso deixa de ser uma regra de contenção e vira a estratégia: a capa
 *  É o argumento. Ninguém clica num texto sobre livros; todo mundo olha
 *  uma parede de capas.
 *
 *  Por isso o pôster tem fundo preto e nada mais: sem gradiente, sem
 *  ilustração, sem "junte-se a nós". As capas fazem o trabalho.
 *
 *  ═══ E ELE NUNCA PODE ESTOURAR ═══
 *
 *  As capas moram na Open Library e no Google, e um serviço de fora que
 *  cai não pode derrubar o pôster: o link já foi mandado, e um 500 aqui
 *  vira o retângulo cinza que a gente está tentando matar. Toda capa que
 *  não responde em dois segundos simplesmente não entra, e o pôster sai
 *  com as que entraram.
 * ════════════════════════════════════════════════════════════════════
 */

export const TAMANHO = { width: 1200, height: 630 };

/** A marca, sólida: a miniatura que o WhatsApp gera é pequena, e o fio fino some. */
export const MARCA =
  "M10.6 17.1L23.6 24L23.6 46.2L26.2 47.9L29.7 57.9Q21.4 54.2 10.6 48.1Z " +
  "M53.4 17.1L40.4 24L40.4 46.2L37.8 47.9L34.3 57.9Q42.6 54.2 53.4 48.1Z " +
  "M31.1 6.2L25.9 14.6L25.9 47L29.7 57.9Z " +
  "M32.9 6.2L38.1 14.6L38.1 47L34.3 57.9Z";

export const PRETO = "#0a0a0a";
export const OSSO = "#fafafa";
export const FRACO = "#8a8a8a";

/**
 * As fontes vão EMBUTIDAS, e não pedidas por nome: o runtime que desenha isto não
 * é o navegador, e um `font-family` por nome ali cai em Times. Elas são subsetadas
 * ao latim, e por isso pesam quilobytes em vez de centenas deles.
 */
export function fontes() {
  const ler = (nome: string) => readFileSync(join(process.cwd(), "assets/fonts", nome));
  return [
    { name: "Marca", data: ler("Fraunces-700.ttf"), weight: 700 as const, style: "normal" as const },
    { name: "Voz", data: ler("Newsreader-400.ttf"), weight: 400 as const, style: "normal" as const },
  ];
}

/**
 * Uma capa, embutida como dado.
 *
 * Não é uma otimização: é o que impede o pôster de estourar. O desenhista de
 * imagem busca `<img src>` sozinho, e uma capa que demora ou responde 404 derruba
 * a imagem INTEIRA. Buscando aqui, uma capa que falha vira `null`, e o pôster sai
 * sem ela.
 */
export async function capa(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(2500),
      headers: { "User-Agent": "Gume (gume.club)" },
    });
    if (!res.ok) return null;

    const tipo = res.headers.get("content-type") ?? "image/jpeg";
    if (!tipo.startsWith("image/")) return null;

    const bytes = Buffer.from(await res.arrayBuffer());
    // Uma capa de mais de 3 MB não é uma capa: é um erro de alguém, e ela não
    // entra na memória deste processo.
    if (bytes.length > 3_000_000) return null;

    return `data:${tipo};base64,${bytes.toString("base64")}`;
  } catch {
    return null; // fonte fora do ar, tempo esgotado, rede caída: o pôster segue
  }
}

/** Várias capas, em paralelo. As que falharem simplesmente não entram. */
export async function capas(urls: (string | null)[], quantas: number): Promise<string[]> {
  const achadas = await Promise.all(urls.slice(0, quantas * 2).map(capa));
  return achadas.filter((c): c is string => c !== null).slice(0, quantas);
}

/**
 * A moldura de todo pôster: fundo preto, o conteúdo, e a marca no rodapé.
 *
 * A marca fica pequena e embaixo de propósito. Quem recebe o link não está
 * procurando o Gume: está olhando o livro do amigo. A marca é a assinatura, e
 * assinatura não grita.
 */
export function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: PRETO,
        padding: 64,
      }}
    >
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>{children}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 40 }}>
        <svg width="30" height="30" viewBox="0 0 64 64">
          <path fill={OSSO} fillRule="nonzero" d={MARCA} />
        </svg>
        <span
          style={{
            display: "flex",
            fontFamily: "Marca",
            fontWeight: 700,
            fontSize: 24,
            color: OSSO,
            transform: "translateY(1.6px)",
          }}
        >
          Gume
        </span>
      </div>
    </div>
  );
}

/**
 * Uma capa no pôster. Quando não há imagem, uma capa TIPOGRÁFICA, e nunca uma
 * caixa cinza: um buraco cinza na parede diz "este catálogo está vazio", que é o
 * contrário do que o pôster está tentando dizer.
 */
export function CapaTile({
  src,
  title,
  largura,
}: {
  src: string | null;
  title: string;
  largura: number;
}) {
  const altura = Math.round(largura * 1.5);

  if (src) {
    return (
      // Um <img> cru, e tem que ser: quem desenha esta imagem não é o navegador, e
      // o <Image> do Next não existe nesse runtime. O alt é vazio de propósito: o
      // texto alternativo do pôster inteiro é declarado na rota, e uma descrição
      // por capa dentro de uma imagem estática não é lida por ninguém.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={largura}
        height={altura}
        style={{ objectFit: "cover", borderRadius: 3 }}
      />
    );
  }

  return (
    <div
      style={{
        width: largura,
        height: altura,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        borderRadius: 3,
        background: "#1c1c1a",
        border: "1px solid #2a2a28",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Voz",
          fontSize: Math.max(12, Math.round(largura * 0.11)),
          color: FRACO,
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        {title.slice(0, 40)}
      </div>
    </div>
  );
}
