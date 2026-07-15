#!/usr/bin/env python3
"""
════════════════════════════════════════════════════════════════════
 O CONTORNO DA PALAVRA "Gume". Gerado, e não desenhado à mão.

 ═══ POR QUE ESTE ARQUIVO NÃO EXISTIA, E POR QUE ELE PRECISA EXISTIR ═══

 `assets/wordmark.json` guarda a palavra em CONTORNO — geometria pura, sem fonte. Ele
 existe porque um `<text>` num SVG solto renderiza em Times na máquina de quem abrir o
 arquivo, e a marca vira outra marca num slide alheio.

 Só que ele era um arquivo ÓRFÃO: alguém o extraiu uma vez, e não havia como refazê-lo.
 No dia em que o peso da marca mudasse — e mudou, de 700 para 400 —, o app passaria a
 mostrar um peso e os assets exportados, outro. Duas marcas, e ninguém saberia qual é a
 verdadeira.

 ═══ E A PROVENIÊNCIA ESTAVA LÁ ═══

 O próprio `wordmark.json` diz de onde veio: "Fraunces 700 (opsz 144, SOFT 30, WONK 0)".
 Este script reproduz o arquivo antigo GLIFO POR GLIFO com esses eixos — é assim que ele
 prova que sabe o que está fazendo antes de escrever qualquer coisa nova.

 ═══ COMO RODAR ═══

     python3 -m venv .venv && .venv/bin/pip install fonttools
     .venv/bin/python scripts/wordmark.py --peso 400

 A fonte variável vem do repositório oficial do Google Fonts, e não de um TTF solto:
 um TTF solto no disco de alguém é uma versão que ninguém mais tem.
════════════════════════════════════════════════════════════════════
"""
import argparse
import json
import urllib.request
from pathlib import Path

from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONTE = (
    "https://github.com/google/fonts/raw/main/ofl/fraunces/"
    "Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf"
)

# Os eixos da marca. Vêm do wordmark.json antigo, que os declarava — e este script
# PROVA que eles estão certos reproduzindo o arquivo antigo antes de gerar o novo.
EIXOS = {"opsz": 144, "SOFT": 30, "WONK": 0}

PALAVRA = "Gume"

# A entreletra da marca. É a mesma do `.mark-word` no CSS: se as duas discordarem, o
# lockup exportado tem um espaçamento e a barra do app tem outro.
TRACK_EM = 0.005

AQUI = Path(__file__).resolve().parent.parent
CACHE = AQUI / ".fraunces-var.ttf"


def baixar() -> Path:
    if not CACHE.exists():
        print(f"  baixando a Fraunces variável do Google Fonts…")
        urllib.request.urlretrieve(FONTE, CACHE)
    return CACHE


def instancia(peso: int) -> TTFont:
    f = TTFont(baixar())
    instantiateVariableFont(f, {**EIXOS, "wght": peso}, inplace=True)
    return f


def contornos(f: TTFont, glifos):
    gs = f.getGlyphSet()
    out = {}
    for g in glifos:
        p = RecordingPen()
        gs[g].draw(p)
        out[g] = [(op, tuple(tuple(map(round, pt)) for pt in pts)) for op, pts in p.value]
    return out


def provar_que_sei_o_que_estou_fazendo() -> None:
    """
    Reproduz o Fraunces-700.ttf que está no repositório, glifo por glifo.

    Se isto falhar, os eixos estão errados — e gerar o peso novo com eixos errados daria
    uma palavra PARECIDA, que é o pior resultado possível: ninguém percebe, e a marca do
    app e a do arquivo divergem em silêncio.
    """
    antigo = AQUI / "assets" / "fonts" / "Fraunces-700.ttf"
    if not antigo.exists():
        print("  (o Fraunces-700.ttf sumiu do repo: não dá para conferir)")
        return

    esperado = contornos(TTFont(antigo), list(PALAVRA))
    obtido = contornos(instancia(700), list(PALAVRA))

    iguais = sum(1 for g in esperado if esperado[g] == obtido[g])
    if iguais != len(esperado):
        raise SystemExit(
            f"✗ os eixos não reproduzem o arquivo que está no repo ({iguais}/{len(esperado)}).\n"
            "  Gerar com eixos errados dá uma palavra PARECIDA, e parecida é o pior resultado:\n"
            "  ninguém percebe, e a marca do app e a do arquivo divergem em silêncio."
        )

    print(f"  ✓ os eixos reproduzem o Fraunces-700 do repo, {iguais}/{iguais} glifos idênticos")


def gerar(peso: int) -> dict:
    f = instancia(peso)
    upm = f["head"].unitsPerEm
    gs = f.getGlyphSet()
    hmtx = f["hmtx"]

    caneta = SVGPathPen(gs, ntos=lambda v: f"{v:.0f}")

    x = 0.0
    for letra in PALAVRA:
        gs[letra].draw(_Deslocado(caneta, x, 0))
        avanco = hmtx[letra][0]
        x += avanco + TRACK_EM * upm

    # A LARGURA INCLUI A ENTRELETRA DEPOIS DA ÚLTIMA LETRA, e não é um descuido.
    #
    # A primeira versão a subtraía ("o último não leva entreletra depois dele"), o que é
    # tipograficamente correto e estava ERRADO aqui: o `wordmark.json` original a incluía, e
    # o `brand.mjs` foi calibrado contra AQUELE número — o alinhamento do lockup, o centro
    # de peso, o respiro.
    #
    # Mudar a largura por um princípio geral e deixar quem a consome achando que nada mudou
    # é o jeito mais silencioso de desalinhar uma marca. Fidelidade primeiro; se um dia
    # alguém quiser tirar a entreletra do fim, que tire e recalibre o lockup junto.
    largura = x

    # O y do SVG cresce para BAIXO, e o da fonte, para cima. A inversão acontece aqui, uma
    # vez, e nunca no consumidor — foi assim que a palavra já saiu de cabeça para baixo.
    d = caneta.getCommands()

    return {
        "_": (
            f"A palavra Gume, em CONTORNO. Fraunces {peso} "
            f"(opsz {EIXOS['opsz']}, SOFT {EIXOS['SOFT']}, WONK {EIXOS['WONK']}), "
            f"entreletra {TRACK_EM}em. Coordenadas em UNIDADES DE FONTE: veja 'upm' "
            f"(esta fonte usa {upm}/em, e nao 1000 — assumir 1000 corta a palavra ao meio, "
            "e foi o que aconteceu). O y JA ESTA INVERTIDO para o SVG: a linha de base e y=0, "
            "e as letras sobem em y negativo. Existe para os lockups de public/logo serem "
            "autossuficientes: um <text> num SVG solto renderiza em Times na maquina de quem "
            "abrir o arquivo. GERADO por scripts/wordmark.py — nao edite a mao."
        ),
        "d": d,
        "widthEm": round(largura / upm, 6),
        "capEm": round(f["OS/2"].sCapHeight / upm, 6),
        "trackEm": TRACK_EM,
        "upm": upm,
    }


class _Deslocado:
    """Desenha um glifo deslocado em x, e inverte o y para o SVG. Uma vez, e aqui."""

    def __init__(self, caneta, dx, dy):
        self.c, self.dx, self.dy = caneta, dx, dy

    def _p(self, pt):
        return (pt[0] + self.dx, -(pt[1] + self.dy))

    def moveTo(self, pt):
        self.c.moveTo(self._p(pt))

    def lineTo(self, pt):
        self.c.lineTo(self._p(pt))

    def curveTo(self, *pts):
        self.c.curveTo(*[self._p(p) for p in pts])

    def qCurveTo(self, *pts):
        self.c.qCurveTo(*[self._p(p) if p is not None else None for p in pts])

    def closePath(self):
        self.c.closePath()

    def endPath(self):
        self.c.endPath()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--peso", type=int, default=400)
    args = ap.parse_args()

    provar_que_sei_o_que_estou_fazendo()

    saida = gerar(args.peso)
    destino = AQUI / "assets" / "wordmark.json"
    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=2) + "\n")

    print(f"  ✓ assets/wordmark.json regerado em Fraunces {args.peso}")
    print(f"    largura {saida['widthEm']}em · upm {saida['upm']} · {len(saida['d'])} caracteres de path")
    print("\n  Agora rode:  pnpm brand")
