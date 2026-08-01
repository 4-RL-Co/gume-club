"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Painel as Dados, Ponto, Fatia, Meta } from "@/lib/painel";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PAINEL. Um dashboard de verdade, e só para o dono.
 *
 *  Esta tela NÃO segue a identidade austera do app de leitor: ela é do dono,
 *  e a régua aqui é ler rápido. Tem cor (com parcimônia), gráfico, filtro,
 *  metas e insights. Está na exceção de lib/voice.test.ts, e a regra global
 *  do app continua valendo para o resto.
 *
 *  Os filtros moram na URL: a barra só reescreve os parâmetros, e a página
 *  busca de novo no servidor. Uma fonte da verdade, e o link do estado filtrado
 *  é compartilhável e recarregável.
 * ════════════════════════════════════════════════════════════════════
 */

const NF = new Intl.NumberFormat("pt-BR");
const n = (x: number) => NF.format(x);
const um = (x: number) => x.toFixed(1).replace(".", ",");
const pctDe = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const ACCENT = "var(--color-accent)";

function Kpi({ valor, label, nota, destaque = false }: { valor: string; label: string; nota?: string; destaque?: boolean }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: "var(--color-rule)",
        background: destaque ? "color-mix(in srgb, var(--color-accent) 10%, var(--surface-1))" : "var(--surface-1)",
      }}
    >
      <div className="tabular text-3xl font-semibold leading-none tracking-tight text-[var(--color-ink)]">{valor}</div>
      <div className="mt-2 text-[12px] font-medium leading-tight text-[var(--color-ink-soft)]">{label}</div>
      {nota && <div className="mt-1 text-[11px] text-[var(--color-ink-faint)]">{nota}</div>}
    </div>
  );
}

function Bloco({ titulo, desc, children }: { titulo: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink)]">{titulo}</h2>
        {desc && <span className="text-[12px] text-[var(--color-ink-faint)]">{desc}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Um cartão de meta: uma barra que enche até o alvo, e o alvo sobe sozinho quando bate. */
/**
 * ════════════════════════════════════════════════════════════════════
 *  O CARTÃO DIZ O QUE ELE CONTA. "CONTRIBUIDORES" NÃO DIZIA.
 *
 *  O dono olhou "contribuidores: 2" e estranhou: no GitHub só ele tinha
 *  contribuído. O número estava CERTO — são duas pessoas que consertaram fichas
 *  de livro dentro do app —, e a palavra é que estava errada.
 *
 *  Num projeto cuja tese é "um app que se constrói", "contribuidor" é justamente
 *  a palavra que significa as duas coisas ao mesmo tempo. E o painel já mostra a
 *  outra num indicador separado ("escreveram código"), então a mesma tela usava um
 *  termo guarda-chuva ao lado do termo específico — e quem lê junta os dois.
 *
 *  Um número certo com nome ambíguo é pior que um número errado: no errado a
 *  pessoa desconfia, no ambíguo ela acredita na leitura que fez.
 *
 *  O `nota` existe para isso: dizer o que entra na conta, embaixo do número.
 * ════════════════════════════════════════════════════════════════════
 */
function CartaoMeta({ titulo, meta, nota }: { titulo: string; meta: Meta; nota?: string }) {
  const pct = Math.min(100, pctDe(meta.atual, meta.alvo));
  const faltam = Math.max(0, meta.alvo - meta.atual);
  return (
    <div className="rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">{titulo}</span>
        {meta.batidas > 0 && (
          <span className="text-[11px] text-[var(--color-ink-faint)]">
            {meta.batidas === 1 ? "1 meta batida" : `${meta.batidas} metas batidas`}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="tabular text-3xl font-semibold leading-none text-[var(--color-ink)]">{n(meta.atual)}</span>
        <span className="text-[15px] text-[var(--color-ink-faint)]">/ {n(meta.alvo)}</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: ACCENT }} />
      </div>
      <div className="mt-2 text-[12px] text-[var(--color-ink-soft)]">
        {faltam === 0 ? "meta batida, mirando na próxima" : `${pct}%, faltam ${n(faltam)}`}
      </div>
      {nota && <div className="mt-1 text-[11px] text-[var(--color-ink-faint)]">{nota}</div>}
    </div>
  );
}

function Area({ pontos }: { pontos: Ponto[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const L = 34;
  const W = 720;
  const H = 200;
  const topo = 16;
  const base = H - 26;

  const { d, area, xs, teto } = useMemo(() => {
    const teto = Math.max(1, ...pontos.map((p) => p.n));
    const larg = W - L - 12;
    const passo = pontos.length > 1 ? larg / (pontos.length - 1) : 0;
    const xs = pontos.map((_, i) => L + i * passo);
    const y = (v: number) => base - (v / teto) * (base - topo);
    const linha = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${xs[i]!.toFixed(1)} ${y(p.n).toFixed(1)}`).join(" ");
    const area =
      pontos.length > 0 ? `${linha} L ${xs[xs.length - 1]!.toFixed(1)} ${base} L ${xs[0]!.toFixed(1)} ${base} Z` : "";
    return { d: linha, area, xs, teto };
  }, [pontos, base]);

  if (pontos.length === 0) return <div className="text-[13px] text-[var(--color-ink-faint)]">sem dados no período</div>;

  const y = (v: number) => base - (v / teto) * (base - topo);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ overflow: "visible" }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * W;
          let melhor = 0;
          let dist = Infinity;
          xs.forEach((xi, i) => {
            const dd = Math.abs(xi - x);
            if (dd < dist) {
              dist = dd;
              melhor = i;
            }
          });
          setHover(melhor);
        }}
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.28" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((g) => {
          const yy = topo + g * (base - topo);
          return (
            <g key={g}>
              <line x1={L} y1={yy} x2={W - 12} y2={yy} stroke="var(--color-rule)" strokeWidth="1" />
              <text x={L - 8} y={yy + 4} textAnchor="end" fontSize="10" fill="var(--color-ink-faint)">
                {Math.round(teto * (1 - g))}
              </text>
            </g>
          );
        })}
        {area && <path d={area} fill="url(#areaFill)" />}
        {d && <path d={d} fill="none" stroke={ACCENT} strokeWidth="2" strokeLinejoin="round" />}
        {hover !== null && (
          <g>
            <line x1={xs[hover]} y1={topo} x2={xs[hover]} y2={base} stroke="var(--color-ink-faint)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={xs[hover]} cy={y(pontos[hover]!.n)} r="4" fill={ACCENT} stroke="var(--surface-1)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="mt-1 text-[12px] text-[var(--color-ink-soft)]">
          <span className="tabular font-semibold text-[var(--color-ink)]">{n(pontos[hover]!.n)}</span> em {pontos[hover]!.chave}
        </div>
      )}
    </div>
  );
}

function Distribuicao({ fatias }: { fatias: Fatia[] }) {
  const teto = Math.max(1, ...fatias.map((f) => f.n));
  return (
    <div className="flex flex-col gap-2.5">
      {fatias.map((f) => (
        <div key={f.rotulo} className="flex items-center gap-3">
          <div className="w-24 shrink-0 text-[13px] text-[var(--color-ink-soft)]">{f.rotulo}</div>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
            <div className="h-full rounded-full" style={{ width: `${(f.n / teto) * 100}%`, background: ACCENT }} />
          </div>
          <div className="tabular w-12 shrink-0 text-right text-[13px] text-[var(--color-ink-soft)]">{n(f.n)}</div>
        </div>
      ))}
    </div>
  );
}

function Divisao({ a, b, rotuloA, rotuloB }: { a: number; b: number; rotuloA: string; rotuloB: string }) {
  const total = Math.max(1, a + b);
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        <div style={{ width: `${(a / total) * 100}%`, background: ACCENT }} />
        <div style={{ width: `${(b / total) * 100}%`, background: "var(--color-ink-faint)" }} />
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-[var(--color-ink-soft)]">
        <span><span className="tabular font-semibold text-[var(--color-ink)]">{n(a)}</span> {rotuloA}</span>
        <span>{rotuloB} <span className="tabular font-semibold text-[var(--color-ink)]">{n(b)}</span></span>
      </div>
    </div>
  );
}

/** Um grupo de botões que escreve um parâmetro na URL. É assim que todo filtro funciona. */
function Grupo<T extends string>({
  valor,
  opcoes,
  onEscolha,
}: {
  valor: T;
  opcoes: { key: T; label: string }[];
  onEscolha: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-full p-1" style={{ background: "var(--surface-2)" }}>
      {opcoes.map((o) => (
        <button
          key={o.key}
          onClick={() => onEscolha(o.key)}
          className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
          style={valor === o.key ? { background: "var(--surface-1)", color: "var(--color-ink)" } : { color: "var(--color-ink-soft)" }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const PERIODOS = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "12m", label: "12 meses" },
  { key: "tudo", label: "tudo" },
  { key: "custom", label: "escolher" },
] as const;

/**
 * ════════════════════════════════════════════════════════════════════
 *  A BASE, PESSOA A PESSOA. E O ENGAJAMENTO É UMA DESCRIÇÃO, NÃO UMA NOTA.
 *
 *  ═══ POR QUE NÃO É UM PLACAR ═══
 *
 *  O Gume se recusa a ordenar GENTE por esforço — está escrito em lib/queridinhos.ts
 *  e vale para o produto inteiro. Aqui a ordem é por tamanho de estante porque isso
 *  responde "quem já construiu alguma coisa", e o rótulo diz o que a pessoa ESTÁ
 *  FAZENDO, não quanto ela vale: `espiando` não é pior que `lendo`, é outro momento.
 *
 *  Uma nota de 0 a 100 diria quem é "melhor leitor", e não existe leitor melhor.
 *
 *  ═══ ISTO É A SALA PRIVADA, E TEM QUE CONTINUAR SENDO ═══
 *
 *  Mostra e-mail. Está atrás de assertIdealizador() no servidor, e o que aqui é
 *  diagnóstico vira, em qualquer outra tela, ranking de leitor. Não reaproveite.
 *
 *  ═══ A COLUNA "INVISÍVEL" ═══
 *
 *  Quem não confirmou o e-mail e não tem estante grande some do explorar, das listas
 *  e dos buscadores. Era um estado que ninguém enxergava — a maior estante do site
 *  ficou escondida assim. Agora ele tem uma coluna, para o dono ver de fora o que a
 *  pessoa não vê de dentro. Ver lib/descoberta.ts.
 * ════════════════════════════════════════════════════════════════════
 */
const COR_ENGAJAMENTO: Record<string, string> = {
  construindo: "#4da76a",
  lendo: "#4a9dc9",
  espiando: "#e8843c",
  sumiu: "var(--color-ink-faint)",
};

function BaseDeGente({ pessoas }: { pessoas: Dados["pessoas"] }) {
  const quando = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "nunca voltou";

  return (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--color-rule)" }}>
      <table className="w-full min-w-[760px] text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
            <th className="px-4 py-3 font-medium">quem</th>
            <th className="px-4 py-3 font-medium">e-mail</th>
            <th className="tabular px-4 py-3 text-right font-medium">livros</th>
            <th className="tabular px-4 py-3 text-right font-medium">escreveu</th>
            <th className="px-4 py-3 font-medium">última vez</th>
            <th className="px-4 py-3 font-medium">está</th>
          </tr>
        </thead>
        <tbody>
          {pessoas.map((p) => (
            <tr key={p.handle} className="border-t" style={{ borderColor: "var(--color-rule)" }}>
              <td className="px-4 py-3">
                <span className="text-[var(--color-ink)]">{p.nome ?? p.handle}</span>
                <span className="ml-2 text-[var(--color-ink-faint)]">@{p.handle}</span>
                {/* Fora do explorar, das listas e dos buscadores AGORA — pela régua de
                    lib/descoberta.ts, que aceita e-mail confirmado OU estante que prove.
                    Olhar só o e-mail marcaria de invisível quem já está visível. */}
                {p.invisivel && (
                  <span className="ml-2 text-[11px]" style={{ color: "#e8843c" }}>
                    invisível
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-[var(--color-ink-soft)]">{p.email}</td>
              <td className="tabular px-4 py-3 text-right text-[var(--color-ink)]">{p.livros}</td>
              <td className="tabular px-4 py-3 text-right text-[var(--color-ink-soft)]">
                {p.resenhas + p.correcoes}
              </td>
              <td className="px-4 py-3 text-[var(--color-ink-soft)]">{quando(p.ultimaVez)}</td>
              <td className="px-4 py-3">
                <span style={{ color: COR_ENGAJAMENTO[p.engajamento] }}>{p.engajamento}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Painel({ dados }: { dados: Dados }) {
  const { filtro, metas, gente, uso, contribuicao, convite, catalogo, pessoas, insights } = dados;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pendente, comecar] = useTransition();
  const [copiado, setCopiado] = useState(false);

  /** Escreve (ou apaga) um parâmetro na URL e recarrega os dados. */
  const setParam = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    }
    comecar(() => router.replace(`${pathname}?${p.toString()}`, { scroll: false }));
  };

  const stickiness = gente.ativos30 > 0 ? Math.round((gente.ativos1 / gente.ativos30) * 100) : 0;
  const ativacao = pctDe(gente.total - uso.contasVazias, gente.total);
  const coberturaCapa = catalogo.edicoes > 0 ? pctDe(catalogo.edicoes - catalogo.semCapa, catalogo.edicoes) : 0;
  const fatiaContribui = pctDe(contribuicao.contribuintes, gente.total);
  const retencao = gente.coorteMadura >= 20 ? pctDe(gente.retidos, gente.coorteMadura) : null;
  const taxa = gente.novos30Anterior >= 10 ? Math.round(((gente.novos30 - gente.novos30Anterior) / gente.novos30Anterior) * 100) : null;

  const copiarParaOClaude = async () => {
    try {
      const res = await fetch("/api/painel/export?formato=md", { cache: "no-store" });
      await navigator.clipboard.writeText(await res.text());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // A cópia falhou. O botão de baixar continua ali, e ele nunca depende da área de transferência.
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-5 pb-32 sm:px-8" style={{ opacity: pendente ? 0.6 : 1, transition: "opacity .15s" }}>
      <header className="mt-14 flex flex-wrap items-end justify-between gap-4 sm:mt-16">
        <div>
          <h1 className="text-[32px] font-semibold leading-none tracking-tight text-[var(--color-ink)]">O Gume, por dentro</h1>
          <p className="mt-2 text-[13px] text-[var(--color-ink-soft)]">Só você vê isto. Saúde do projeto, sem rastrear ninguém.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copiarParaOClaude}
            className="rounded-full border px-4 py-2 text-[13px] font-medium"
            style={{ borderColor: "var(--color-rule)", color: "var(--color-ink)" }}
          >
            {copiado ? "copiado" : "copiar para o Claude"}
          </button>
          <a
            href="/api/painel/export?formato=md"
            download="gume-painel.md"
            className="rounded-full px-4 py-2 text-[13px] font-medium"
            style={{ background: "var(--color-ink)", color: "var(--color-canvas)" }}
          >
            baixar .md
          </a>
        </div>
      </header>

      {/* ─────────────────────────────── METAS */}
      <Bloco titulo="metas" desc="o alvo sobe quando você bate nele">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CartaoMeta titulo="usuários" meta={metas.usuarios} />
          <CartaoMeta
            titulo="consertaram o acervo"
            meta={metas.contribuidores}
            nota="quem mandou correção de ficha ou capa. quem escreve código é outro número, mais abaixo."
          />
        </div>
      </Bloco>

      {/* ─────────────────────────────── A BASE, PESSOA A PESSOA */}
      <Bloco titulo="a base" desc="quem está aqui, e o que cada um está fazendo">
        <BaseDeGente pessoas={pessoas} />
      </Bloco>

      {/* ─────────────────────────────── INSIGHTS */}
      {insights.length > 0 && (
        <Bloco titulo="leitura rápida">
          <ul className="flex flex-col gap-2">
            {insights.map((i, k) => (
              <li
                key={k}
                className="rounded-xl border-l-2 px-4 py-3 text-[14px] leading-relaxed text-[var(--color-ink-soft)]"
                style={{ borderColor: ACCENT, background: "var(--surface-1)" }}
              >
                {i}
              </li>
            ))}
          </ul>
        </Bloco>
      )}

      {/* ─────────────────────────────── FILTROS */}
      <Bloco titulo="filtros" desc="valem para o gráfico, o log e o resumo do período">
        <div className="flex flex-col gap-4 rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Filtro rotulo="período">
              <Grupo
                valor={filtro.periodo}
                opcoes={PERIODOS.map((p) => ({ key: p.key, label: p.label }))}
                onEscolha={(v) => setParam({ periodo: v })}
              />
            </Filtro>
            {filtro.periodo === "custom" && (
              <div className="flex items-center gap-2 text-[12px] text-[var(--color-ink-soft)]">
                <input
                  type="date"
                  defaultValue={filtro.desde ?? ""}
                  onChange={(e) => setParam({ desde: e.target.value })}
                  className="rounded-lg border px-2 py-1"
                  style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)", color: "var(--color-ink)" }}
                />
                <span>até</span>
                <input
                  type="date"
                  defaultValue={filtro.ate ?? ""}
                  onChange={(e) => setParam({ ate: e.target.value })}
                  className="rounded-lg border px-2 py-1"
                  style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)", color: "var(--color-ink)" }}
                />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Filtro rotulo="agrupar por">
              <Grupo
                valor={filtro.gran}
                opcoes={[{ key: "dia", label: "dia" }, { key: "semana", label: "semana" }, { key: "mes", label: "mês" }]}
                onEscolha={(v) => setParam({ gran: v })}
              />
            </Filtro>
            <Filtro rotulo="método">
              <Grupo
                valor={filtro.metodo}
                opcoes={[{ key: "todos", label: "todos" }, { key: "google", label: "google" }, { key: "email", label: "e-mail" }]}
                onEscolha={(v) => setParam({ metodo: v })}
              />
            </Filtro>
            <Filtro rotulo="origem">
              <Grupo
                valor={filtro.origem}
                opcoes={[{ key: "todos", label: "todas" }, { key: "convite", label: "convite" }, { key: "sozinho", label: "sozinho" }]}
                onEscolha={(v) => setParam({ origem: v })}
              />
            </Filtro>
          </div>
        </div>
      </Bloco>

      {/* ─────────────────────────────── GENTE */}
      <Bloco titulo="gente">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi valor={n(gente.total)} label="contas" destaque />
          <Kpi valor={n(gente.ativos1)} label="ativos hoje" nota="DAU" />
          <Kpi valor={n(gente.ativos7)} label="ativos em 7 dias" nota="WAU" />
          <Kpi valor={n(gente.ativos30)} label="ativos em 30 dias" nota="MAU" />
          <Kpi valor={`${stickiness}%`} label="aderência" nota="DAU / MAU" />
          <Kpi valor={n(gente.adormecidos)} label="adormecidos" nota="sem aparecer há 30+ dias" />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi valor={retencao === null ? "poucos" : `${retencao}%`} label="retenção 1a semana" nota={`${n(gente.retidos)}/${n(gente.coorteMadura)}`} />
          <Kpi valor={n(gente.metodoGoogle)} label="entraram por google" />
          <Kpi valor={n(gente.metodoEmail)} label="entraram por e-mail" />
          <Kpi valor={n(gente.novosPeriodo)} label="novos no período" nota="respeita o filtro" destaque />
        </div>

        <div className="mt-4 rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              cadastros por {filtro.gran === "mes" ? "mês" : filtro.gran}
            </span>
            <span className="text-[12px] text-[var(--color-ink-faint)]">
              {filtro.periodo === "tudo" ? "desde o começo" : filtro.periodo === "custom" ? "período escolhido" : `últimos ${PERIODOS.find((p) => p.key === filtro.periodo)?.label}`}
            </span>
          </div>
          <div className="mt-4">
            <Area pontos={gente.serie} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-[var(--color-ink-soft)]">
            <span><span className="tabular font-semibold text-[var(--color-ink)]">{n(gente.novos7)}</span> em 7 dias</span>
            <span><span className="tabular font-semibold text-[var(--color-ink)]">{n(gente.novos30)}</span> em 30 dias</span>
            <span><span className="tabular font-semibold text-[var(--color-ink)]">{n(gente.novos90)}</span> em 90 dias</span>
            <span>
              {taxa === null ? "poucos dados para uma taxa" : (
                <><span className="tabular font-semibold text-[var(--color-ink)]">{taxa > 0 ? "+" : ""}{taxa}%</span> contra os 30 dias anteriores</>
              )}
            </span>
          </div>
        </div>

        {/* O LOG. O e-mail está aqui, e não sai desta tela (o .md e o backup por token não o levam). */}
        <div className="mt-4 overflow-x-auto rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
          <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            quem chegou {filtro.periodo === "tudo" && filtro.metodo === "todos" && filtro.origem === "todos" ? "por último" : "no recorte"}
          </div>
          {gente.log.length === 0 ? (
            <p className="mt-3 text-[13px] text-[var(--color-ink-soft)]">ninguém dentro deste filtro.</p>
          ) : (
            <table className="mt-3 w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
                  <th className="py-1 pr-4 font-medium">pessoa</th>
                  <th className="py-1 pr-4 font-medium">e-mail</th>
                  <th className="py-1 pr-4 font-medium">quando</th>
                  <th className="py-1 pr-4 font-medium">método</th>
                  <th className="py-1 font-medium">procedência</th>
                </tr>
              </thead>
              <tbody>
                {gente.log.map((c) => (
                  <tr key={c.handle} className="border-t" style={{ borderColor: "var(--color-rule)" }}>
                    <td className="py-2 pr-4 text-[var(--color-ink)]">{c.handle}</td>
                    <td className="py-2 pr-4 text-[var(--color-ink-faint)]">{c.email}</td>
                    <td className="tabular py-2 pr-4 text-[var(--color-ink-soft)]">{c.quando}</td>
                    <td className="py-2 pr-4 text-[var(--color-ink-soft)]">{c.metodo === "google" ? "google" : c.metodo === "email" ? "e-mail" : "outro"}</td>
                    <td className="py-2 text-[var(--color-ink-soft)]">{c.convidadoPor ? `veio por ${c.convidadoPor}` : "chegou sozinho"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Bloco>

      {/* ─────────────────────────────── USO */}
      <Bloco titulo="uso" desc="média mente, mediana não">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi valor={um(uso.medianaLivros)} label="livros por pessoa" nota={`média ${um(uso.mediaLivros)}`} />
          <Kpi valor={um(uso.medianaLidos)} label="lidos por pessoa" nota={`média ${um(uso.mediaLidos)}`} />
          <Kpi valor={`${ativacao}%`} label="ativação" nota="tem ao menos 1 livro" destaque />
          <Kpi valor={n(uso.resenhas)} label="resenhas" nota={`${n(uso.resenhas30)} em 30 dias`} />
          <Kpi valor={n(uso.notasDadas30)} label="notas em 30 dias" />
          <Kpi valor={n(uso.contasVazias)} label="contas vazias" />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
            <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">tamanho das estantes</div>
            <div className="mt-4"><Distribuicao fatias={uso.tamanhoEstante} /></div>
          </div>
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
            <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">as notas, em palavra</div>
            <div className="mt-4"><Distribuicao fatias={uso.notas} /></div>
          </div>
        </div>

        <p className="mt-3 text-[12px] text-[var(--color-ink-faint)]">
          importações e exportações ainda não são contadas. Medir a saída é a próxima coisa aqui.
        </p>
      </Bloco>

      {/* ─────────────────────────────── CONTRIBUIÇÃO */}
      <Bloco titulo="contribuição" desc="a tese do projeto">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi valor={`${fatiaContribui}%`} label="das contas contribuiu" nota="ao menos uma vez" destaque />
          <Kpi valor={n(contribuicao.correcoesPeriodo)} label="correções no período" nota={`${n(contribuicao.correcoes30)} em 30 dias`} />
          <Kpi valor={n(contribuicao.pessoasQueCorrigiram)} label="pessoas que corrigiram" />
          <Kpi valor={n(contribuicao.capasEsperando)} label="capas esperando" nota={`${n(contribuicao.capasEnviadas)} enviadas`} />
          <Kpi valor={n(contribuicao.obrasDeLeitor)} label="obras de leitor" />
          <Kpi valor={contribuicao.codigo === null ? "sem dado" : n(contribuicao.codigo)} label="escreveram código" nota={contribuicao.codigo === null ? "o github não respondeu" : undefined} />
        </div>
      </Bloco>

      {/* ─────────────────────────────── CONVITE */}
      <Bloco titulo="convite" desc="a única alavanca de crescimento">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
            <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">como as contas chegaram</div>
            <div className="mt-5"><Divisao a={convite.porConvite} b={convite.sozinhos} rotuloA="por convite" rotuloB="sozinhos" /></div>
          </div>
          <Kpi valor={n(convite.quemJaConvidou)} label="pessoas já convidaram alguém" nota={`${um(convite.mediaPorConvidante)} vingaram por convidante`} />
          <Kpi valor={n(convite.convitesQueVingaram)} label="convites viraram conta de verdade" destaque />
        </div>
      </Bloco>

      {/* ─────────────────────────────── CATÁLOGO */}
      <Bloco titulo="catálogo">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi valor={n(catalogo.obras)} label="obras" />
          <Kpi valor={n(catalogo.edicoes)} label="edições" />
          <Kpi valor={`${coberturaCapa}%`} label="edições com capa" nota={`${n(catalogo.semCapa)} sem`} destaque />
          <Kpi valor={n(catalogo.semAno)} label="sem ano" />
          <Kpi valor={n(catalogo.semEditora)} label="sem editora" />
          <Kpi valor={n(catalogo.semAutor)} label="obras sem autor" />
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
          <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">procuraram e não acharam</div>
          {catalogo.buscasVazias.length === 0 ? (
            <p className="mt-3 text-[13px] text-[var(--color-ink-soft)]">ninguém bateu numa parede ainda, ou o catálogo deu conta.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {catalogo.buscasVazias.map((b) => (
                <span key={b.termo} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[13px]" style={{ borderColor: "var(--color-rule)" }}>
                  <span className="text-[var(--color-ink)]">{b.termo}</span>
                  <span className="tabular text-[11px] text-[var(--color-ink-faint)]">{b.quantas}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </Bloco>

      {/* ─────────────────────────────── EXPORTAR / AGENTE */}
      <Bloco titulo="exportar e ler por agente">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border p-5 text-[13px] leading-relaxed text-[var(--color-ink-soft)]" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
            <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">os números, para o Claude</div>
            <p className="mt-3">
              <span className="font-medium text-[var(--color-ink)]">copiar para o Claude</span> (lá em cima) copia tudo em markdown;
              <span className="font-medium text-[var(--color-ink)]"> baixar .md</span> salva o arquivo. Os filtros valem no export também.
            </p>
            <p className="mt-3">Para um agente ler sozinho, defina <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[12px]">PAINEL_TOKEN</code> e:</p>
            <pre className="mt-3 overflow-x-auto rounded-xl p-3 text-[12px]" style={{ background: "var(--surface-2)", color: "var(--color-ink)" }}>
{`curl -H "authorization: Bearer $PAINEL_TOKEN" \\
  ${typeof window !== "undefined" ? window.location.origin : ""}/api/painel/export?formato=md`}
            </pre>
            <p className="mt-3 text-[12px] text-[var(--color-ink-faint)]">Esse arquivo não leva e-mail: só números e apelidos. Troque por <code className="rounded bg-[var(--surface-2)] px-1 py-0.5">formato=json</code> para dado estruturado.</p>
          </div>

          <div className="rounded-2xl border p-5 text-[13px] leading-relaxed text-[var(--color-ink-soft)]" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
            <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">o banco inteiro</div>
            <p className="mt-3">
              Isto baixa <span className="font-medium text-[var(--color-ink)]">tudo</span>, inclusive e-mail e estante privada de todo mundo. Guarde
              como se guarda um backup de produção. Só a sua sessão baixa, nunca o token.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/api/painel/backup?formato=ndjson" download="gume-backup.ndjson" className="rounded-full px-4 py-2 text-[13px] font-medium" style={{ background: "var(--color-ink)", color: "var(--color-canvas)" }}>
                baixar banco (.ndjson)
              </a>
              <a href="/api/painel/backup?formato=sql" download="gume-backup.sql" className="rounded-full border px-4 py-2 text-[13px] font-medium" style={{ borderColor: "var(--color-rule)", color: "var(--color-ink)" }}>
                baixar dump (.sql)
              </a>
            </div>
            <p className="mt-3 text-[12px] text-[var(--color-ink-faint)]">O .ndjson roda em qualquer lugar e aguenta banco grande. O .sql é restaurável, quando o servidor tem pg_dump.</p>
          </div>
        </div>
      </Bloco>
    </main>
  );
}

function Filtro({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">{rotulo}</span>
      {children}
    </div>
  );
}
