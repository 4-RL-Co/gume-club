"use client";

import { useEffect, useRef, useState } from "react";
import { JANELA, SIZE, retangulo, travar } from "@/lib/recorte";
import { tipoDeImagem } from "@/lib/tipo-de-imagem";

/**
 * ════════════════════════════════════════════════════════════════════
 *  ESCOLHER UMA FOTO, RECORTAR NO QUADRADO, ENVIAR.
 *
 *  O recorte acontece AQUI, num canvas, antes de um byte sair do navegador: a pessoa
 *  escolhe uma foto de 6 MB do celular e a gente manda um quadrado de 512px. Não custa
 *  nada ao servidor, quase nada ao plano de dados dela, e a porta de upload nunca precisa
 *  lidar com um arquivo gigante.
 *
 *  Sem biblioteca de corte. É um quadrado, um zoom e um arrastar, e é para isso que
 *  existe um canvas.
 *
 *  ═══ OS DOIS BUGS QUE ESTE ARQUIVO TINHA ═══
 *
 *  "Quando clico para colocar foto de perfil, demora um pouco, além disso a foto já começa
 *  com muuito zoom e fica ruim de ajustar."
 *
 *  1. O ZOOM — e ele era pior do que parecia.
 *
 *     A imagem entrava na janela de corte no TAMANHO NATURAL. Uma foto de celular tem
 *     3024 pixels de largura, e a janela tem 256: a pessoa via o miolo de um pedaço,
 *     ampliado doze vezes, e não tinha como afastar (o zoom só ia de 1 para cima).
 *
 *     E o pior: a função que SALVA já calculava o enquadramento "cobrir" — ela dividia o
 *     tamanho do quadrado pelo tamanho natural da foto. **A prévia e o resultado nunca
 *     foram a mesma coisa.** A pessoa ajustava um enquadramento e recebia outro.
 *
 *     Um recorte em que o que se vê não é o que se leva não é um recorte: é um sorteio.
 *
 *     Agora os dois lados usam a MESMA conta (`cobrir()`), e o zoom 1 é a foto inteira
 *     cabendo no quadrado. Daí para cima é escolha de quem está enquadrando.
 *
 *  2. A DEMORA.
 *
 *     `readAsDataURL` transforma a foto num texto base64 — uma foto de 6 MB vira uma
 *     string de 8 MB, que atravessa o React como estado e vai parar no `src` da imagem.
 *     No celular isso trava a tela por segundos, e o único motivo de existir era não
 *     precisar limpar nada depois.
 *
 *     `createObjectURL` devolve um endereço na hora, sem cópia e sem conversão. Ele
 *     precisa ser devolvido (`revokeObjectURL`), e o endereço vivo mora num ref para que a
 *     devolução aconteça só na troca de foto e no desmonte, e nunca a cada re-render. Ver o
 *     comentário do `urlRef` mais abaixo, que é o bug número três: a caixa cinza.
 * ════════════════════════════════════════════════════════════════════
 */

export function AvatarPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  /** O tamanho de verdade da foto. Sem ele não dá para enquadrar nada. */
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [convertendo, setConvertendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragging = useRef<{ x: number; y: number } | null>(null);
  /** O endereço `blob:` vivo. Fica num ref, e não num efeito com dependência de `src`. */
  const urlRef = useRef<string | null>(null);
  /** O que os bytes do arquivo escolhido disseram. A recusa usa isto para falar a verdade. */
  const tipoRef = useRef<ReturnType<typeof tipoDeImagem>>("desconhecido");

  /**
   * ═══ POR QUE O REVOKE MORA AQUI, E NÃO NUM EFEITO [src] ═══
   *
   * O endereço temporário da foto precisa ser devolvido, ou fica na memória. A versão
   * antiga fazia isso num efeito que dependia de `src` — e um efeito assim roda a sua
   * limpeza a cada troca de `src` e, em desenvolvimento, o React monta e desmonta o
   * componente uma vez de propósito. Nesse desmonte simulado, o `blob:` era revogado ANTES
   * de a prévia carregá-lo, e a caixa ficava cinza sem erro nenhum.
   *
   * Agora o endereço vivo mora num ref. Só duas coisas o revogam: escolher outra foto
   * (que revoga a anterior) e o desmonte de verdade. Trocar de zoom, arrastar ou qualquer
   * re-render não encostam nele.
   */
  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  async function pick(file: File) {
    setError(null);

    /**
     * ═══ FOTO DE IPHONE (HEIC) PASSA A FUNCIONAR, AGORA PELOS BYTES ═══
     *
     * O Chrome não decodifica HEIC, e é o formato padrão do iPhone. Em vez de mandar a
     * pessoa exportar como JPG, a gente converte no navegador, antes do recorte.
     *
     * E a decisão vem da ASSINATURA do arquivo, nunca do nome: um leitor real ficou
     * preso num "não consegui abrir" porque o arquivo dele DIZIA .png e era HEIC por
     * dentro (conversor que só renomeia faz isso, e o compartilhar do iPhone também).
     * A extensão dizia uma coisa, os bytes diziam outra, e a gente acreditava na
     * extensão: a conversão era pulada e a tela mandava a pessoa fazer o que ela
     * achava que já tinha feito. Mesma regra do servidor (o sniff da rota de upload):
     * um arquivo é o que os bytes dele dizem. Ver lib/tipo-de-imagem.ts.
     *
     * A biblioteca (`heic2any`, com o decodificador libheif em WASM) é grande, então ela é
     * importada SOB DEMANDA, só quando um HEIC de verdade aparece. Quem sobe um JPG comum
     * nunca baixa esse peso.
     */
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const tipo = tipoDeImagem(bytes);
    tipoRef.current = tipo;
    const ehHeic =
      tipo === "heic" || /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    if (tipo === "desconhecido" && !ehHeic && !file.type.startsWith("image/")) {
      return setError("escolha uma imagem");
    }

    let usavel = file;
    if (ehHeic) {
      setConvertendo(true);
      try {
        const { default: heic2any } = await import("heic2any");
        const saida = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
        const jpeg = Array.isArray(saida) ? saida[0]! : saida;
        usavel = new File([jpeg], file.name.replace(/\.hei[cf]$/i, ".jpg"), { type: "image/jpeg" });
      } catch {
        setConvertendo(false);
        return recusar();
      }
      setConvertendo(false);
    }

    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(usavel);
    urlRef.current = url;

    setNatural(null);
    setZoom(1);
    setPos({ x: 0, y: 0 });
    setSrc(url);
  }

  /** Larga o blob atual e volta para o botão de escolher. Usado no cancelar e no fim do save. */
  function limpar() {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setSrc(null);
  }

  /**
   * ═══ A FOTO QUE O NAVEGADOR NÃO ABRE ═══
   *
   * O `onError` dispara, ou o `onLoad` vem com dimensão zero, e sem tratar isso a caixa
   * de recorte ficava CINZA em silêncio. A recusa é dita em voz alta, e ela conta O QUE
   * a gente descobriu do arquivo: o HEIC de verdade agora converte sozinho (mesmo de
   * nome trocado), então chegar aqui é conversão que falhou ou arquivo que não abre, e
   * cada caso tem a sua frase. Mandar todo mundo "exportar como JPG" era acusar de HEIC
   * uma pessoa que já estava mandando um JPG.
   */
  function recusar() {
    setError(
      tipoRef.current === "heic"
        ? "A foto é HEIC, do iPhone, e a conversão não deu certo por aqui. Exporte como JPG ou PNG e tente de novo."
        : tipoRef.current === "desconhecido"
          ? "Isso não parece uma imagem por dentro, seja qual for o nome do arquivo. Exporte como JPG ou PNG e tente de novo."
          : "Não consegui abrir essa imagem: ela pode estar corrompida ou ser pesada demais para este aparelho. Exporte de novo como JPG e tente.",
    );
    limpar();
  }

  /** A trava do arrasto. O zoom entra como parâmetro porque quem mexe no zoom precisa
      travar contra o zoom NOVO, e o estado, nesse instante, ainda é o antigo. */
  const preso = (p: { x: number; y: number }, z: number) =>
    natural ? travar(natural, z, p) : { x: 0, y: 0 };

  async function save() {
    const img = imgRef.current;
    if (!img || !natural) return;
    setBusy(true);
    setError(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#151514";
      ctx.fillRect(0, 0, SIZE, SIZE);

      /**
       * A MESMA função que desenha a prévia, só que na escala do quadrado que vai para o
       * servidor. É isto que faz o que a pessoa vê ser o que ela leva — e era exatamente
       * isto que não acontecia: aqui havia uma segunda conta, e ela discordava da tela.
       */
      const r = retangulo(SIZE, natural, zoom, pos);
      ctx.drawImage(img, r.x, r.y, r.w, r.h);

      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.88));
      if (!blob) throw new Error("crop");

      const body = new FormData();
      body.append("file", blob, "avatar.jpg");
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "falhou");

      onChange(json.url);
      limpar();
    } catch (e) {
      setError(e instanceof Error && e.message !== "crop" ? e.message : "não deu para enviar");
    } finally {
      setBusy(false);
    }
  }

  if (src) {
    return (
      <div>
        <div
          className="relative h-64 w-64 cursor-grab overflow-hidden active:cursor-grabbing"
          style={{ borderRadius: "var(--radius-cover)", background: "var(--color-card)" }}
          onPointerDown={(e) => {
            dragging.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!dragging.current) return;
            setPos(
              preso(
                { x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y },
                zoom,
              ),
            );
          }}
          onPointerUp={() => (dragging.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              // Dimensão zero é um formato que o navegador não decodificou (HEIC): a foto
              // não existe para o canvas, então trata como recusa, e não como sucesso.
              if (!el.naturalWidth || !el.naturalHeight) return recusar();
              setNatural({ w: el.naturalWidth, h: el.naturalHeight });
            }}
            onError={recusar}
            className="pointer-events-none absolute max-w-none"
            style={{
              /**
               * ═══ A PRÉVIA CHAMA A MESMA FUNÇÃO QUE O CANVAS ═══
               *
               * Ela era desenhada com `transform: scale(...)` — uma fórmula em CSS — e o
               * canvas era desenhado com outra fórmula, em JavaScript. Duas fórmulas para
               * a mesma coisa: elas divergiram, e a pessoa passou a ajustar um
               * enquadramento e receber outro.
               *
               * Agora as duas são a MESMA chamada de `retangulo()`, em escalas diferentes.
               * Não é que elas concordem: é que não existem duas.
               */
              ...(natural
                ? (() => {
                    const r = retangulo(JANELA, natural, zoom, pos);
                    return { left: r.x, top: r.y, width: r.w, height: r.h };
                  })()
                : { visibility: "hidden" as const }),
            }}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.02}
          value={zoom}
          onChange={(e) => {
            const z = Number(e.target.value);
            setZoom(z);
            // Afastar diminui a folga, então o que estava no limite tem que voltar para
            // dentro dele — senão afastar deixa uma faixa de fundo aparecendo na borda.
            setPos((p) => preso(p, z));
          }}
          className="mt-4 w-64 accent-[var(--color-accent)]"
          aria-label="aproximar"
        />

        <p className="mt-2 text-[13px] text-[var(--color-ink-faint)]">
          Arraste para escolher o pedaço. O que você vê aqui é o que vai ficar.
        </p>

        {error && <p className="mt-2 text-[13px] text-[var(--color-perigo)]">{error}</p>}

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={busy || !natural}
            className="rounded-[var(--radius-control)] bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-canvas)] disabled:opacity-40"
          >
            {busy ? "Enviando" : "Usar esta foto"}
          </button>
          <button
            type="button"
            onClick={limpar}
            className="text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <div
        className="cover-lift h-20 w-20 shrink-0 overflow-hidden bg-[var(--color-card)]"
        style={{ borderRadius: "var(--radius-cover)" }}
      >
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div>
        <label className="cursor-pointer text-[13px] text-[var(--color-ink-soft)] underline decoration-[var(--color-rule)] underline-offset-4 hover:text-[var(--color-ink)]">
          {convertendo ? "convertendo a foto" : value ? "trocar a foto" : "escolher uma foto"}
          <input
            type="file"
            accept="image/*,.heic,.heif"
            className="sr-only"
            disabled={convertendo}
            onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
          />
        </label>
        {error && <p className="mt-2 max-w-xs text-[13px] text-[var(--color-perigo)]">{error}</p>}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-4 text-[13px] text-[var(--color-ink-faint)] hover:text-[var(--color-perigo)]"
          >
            tirar
          </button>
        )}
        {error && <p className="mt-2 text-[13px] text-[var(--color-perigo)]">{error}</p>}
      </div>
    </div>
  );
}
