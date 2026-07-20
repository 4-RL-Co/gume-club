"use client";

import { useMemo, useState } from "react";
import type { Painel as Dados, Ponto, Fatia } from "@/lib/painel";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PAINEL. Um dashboard de verdade, e só para o dono.
 *
 *  Esta tela NÃO segue a identidade austera do app de leitor: ela é do dono,
 *  e a régua aqui é OUTRA. Ler os gráficos rápido ganha de ser discreto.
 *  Tem cor (com parcimônia), tem gráfico, tem filtro. Ela está na exceção de
 *  lib/voice.test.ts, e a regra global do app continua valendo para o resto.
 *
 *  Fala com o dono, então usa palavras de dono: retenção, coorte, aderência,
 *  DAU/WAU/MAU, mediana. E dá duas saídas para um agente ler: baixar o .md e
 *  copiar o .md para colar no Claude. Ver a rota /api/painel/export.
 * ════════════════════════════════════════════════════════════════════
 */

const NF = new Intl.NumberFormat("pt-BR");
const n = (x: number) => NF.format(x);
const um = (x: number) => x.toFixed(1).replace(".", ",");
const pctDe = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

const ACCENT = "var(--color-accent)";

/** Um cartão de número: valor grande, rótulo, e uma nota opcional embaixo. */
function Kpi({
  valor,
  label,
  nota,
  destaque = false,
}: {
  valor: string;
  label: string;
  nota?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: "var(--color-rule)",
        background: destaque ? "color-mix(in srgb, var(--color-accent) 10%, var(--surface-1))" : "var(--surface-1)",
      }}
    >
      <div className="tabular text-3xl font-semibold leading-none tracking-tight text-[var(--color-ink)]">
        {valor}
      </div>
      <div className="mt-2 text-[12px] font-medium leading-tight text-[var(--color-ink-soft)]">
        {label}
      </div>
      {nota && <div className="mt-1 text-[11px] text-[var(--color-ink-faint)]">{nota}</div>}
    </div>
  );
}

function Bloco({
  titulo,
  desc,
  children,
}: {
  titulo: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink)]">
          {titulo}
        </h2>
        {desc && <span className="text-[12px] text-[var(--color-ink-faint)]">{desc}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * O gráfico de crescimento: área com linha, grade leve e um ponto que segue o mouse.
 * SVG puro, sem biblioteca: controle total, nada a instalar, e funciona em claro e escuro.
 */
function Area({ pontos, altura = 200 }: { pontos: Ponto[]; altura?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const L = 34; // margem esquerda para os rótulos do eixo
  const W = 720;
  const H = altura;
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
      pontos.length > 0
        ? `${linha} L ${xs[xs.length - 1]!.toFixed(1)} ${base} L ${xs[0]!.toFixed(1)} ${base} Z`
        : "";
    return { d: linha, area, xs, teto };
  }, [pontos, base, topo]);

  if (pontos.length === 0) {
    return <div className="text-[13px] text-[var(--color-ink-faint)]">sem dados no período</div>;
  }

  const y = (v: number) => base - (v / teto) * (base - topo);
  const linhasGrade = [0, 0.5, 1];

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

        {linhasGrade.map((g) => {
          const yy = topo + g * (base - topo);
          const val = Math.round(teto * (1 - g));
          return (
            <g key={g}>
              <line x1={L} y1={yy} x2={W - 12} y2={yy} stroke="var(--color-rule)" strokeWidth="1" />
              <text x={L - 8} y={yy + 4} textAnchor="end" fontSize="10" fill="var(--color-ink-faint)">
                {val}
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
          <span className="tabular font-semibold text-[var(--color-ink)]">{n(pontos[hover]!.n)}</span>{" "}
          em {pontos[hover]!.chave}
        </div>
      )}
    </div>
  );
}

/** Distribuição em linhas horizontais: rótulo, barra, número. Para as notas. */
function Distribuicao({ fatias }: { fatias: Fatia[] }) {
  const teto = Math.max(1, ...fatias.map((f) => f.n));
  return (
    <div className="flex flex-col gap-2.5">
      {fatias.map((f) => (
        <div key={f.rotulo} className="flex items-center gap-3">
          <div className="w-28 shrink-0 text-[13px] text-[var(--color-ink-soft)]">{f.rotulo}</div>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
            <div className="h-full rounded-full" style={{ width: `${(f.n / teto) * 100}%`, background: ACCENT }} />
          </div>
          <div className="tabular w-12 shrink-0 text-right text-[13px] text-[var(--color-ink-soft)]">{n(f.n)}</div>
        </div>
      ))}
    </div>
  );
}

/** Uma barra dividida em duas partes, para "por convite" contra "sozinhos". */
function Divisao({ a, b, rotuloA, rotuloB }: { a: number; b: number; rotuloA: string; rotuloB: string }) {
  const total = Math.max(1, a + b);
  return (
    <div>
      <div className="flex h-4 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        <div style={{ width: `${(a / total) * 100}%`, background: ACCENT }} />
        <div style={{ width: `${(b / total) * 100}%`, background: "var(--color-ink-faint)" }} />
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-[var(--color-ink-soft)]">
        <span>
          <span className="tabular font-semibold text-[var(--color-ink)]">{n(a)}</span> {rotuloA}
        </span>
        <span>
          {rotuloB} <span className="tabular font-semibold text-[var(--color-ink)]">{n(b)}</span>
        </span>
      </div>
    </div>
  );
}

const PERIODOS = [
  { key: "dia", label: "dia" },
  { key: "semana", label: "semana" },
  { key: "mes", label: "mês" },
] as const;
type Periodo = (typeof PERIODOS)[number]["key"];

export function Painel({ dados }: { dados: Dados }) {
  const { gente, uso, contribuicao, convite, catalogo } = dados;
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const [copiado, setCopiado] = useState(false);

  const serie = periodo === "dia" ? gente.porDia : periodo === "semana" ? gente.porSemana : gente.porMes;
  const janela = periodo === "dia" ? "últimos 30 dias" : periodo === "semana" ? "últimas 12 semanas" : "últimos 12 meses";

  const stickiness = gente.ativos30 > 0 ? Math.round((gente.ativos1 / gente.ativos30) * 100) : 0;
  const ativacao = pctDe(gente.total - uso.contasVazias, gente.total);
  const fatiaContribui = pctDe(contribuicao.contribuintes, gente.total);
  const retencaoMadura = gente.coorteMadura >= 20;
  const retencao = retencaoMadura ? pctDe(gente.retidos, gente.coorteMadura) : null;
  const taxaBase = gente.novos30Anterior;
  const taxa =
    taxaBase >= 10 ? Math.round(((gente.novos30 - taxaBase) / taxaBase) * 100) : null;

  const copiarParaOClaude = async () => {
    try {
      const res = await fetch("/api/painel/export?formato=md", { cache: "no-store" });
      const texto = await res.text();
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // A cópia falhou (permissão negada, ou a rede caiu). Não faz nada: o botão de baixar
      // continua ali, e ele nunca depende da área de transferência.
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-5 pb-32 sm:px-8">
      <header className="mt-14 flex flex-wrap items-end justify-between gap-4 sm:mt-16">
        <div>
          <h1 className="text-[32px] font-semibold leading-none tracking-tight text-[var(--color-ink)]">
            O Gume, por dentro
          </h1>
          <p className="mt-2 text-[13px] text-[var(--color-ink-soft)]">
            Só você vê isto. Saúde do projeto, sem rastrear ninguém.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copiarParaOClaude}
            className="rounded-full border px-4 py-2 text-[13px] font-medium transition-colors"
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

      {/* ─────────────────────────────── GENTE */}
      <Bloco titulo="gente">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi valor={n(gente.total)} label="contas" destaque />
          <Kpi valor={n(gente.ativos1)} label="ativos hoje" nota="DAU" />
          <Kpi valor={n(gente.ativos7)} label="ativos em 7 dias" nota="WAU" />
          <Kpi valor={n(gente.ativos30)} label="ativos em 30 dias" nota="MAU" />
          <Kpi valor={`${stickiness}%`} label="aderência" nota="DAU / MAU" />
          <Kpi
            valor={retencao === null ? "poucos" : `${retencao}%`}
            label="retenção na 1a semana"
            nota={retencao === null ? `${n(gente.retidos)}/${n(gente.coorteMadura)} com chance` : `${n(gente.retidos)}/${n(gente.coorteMadura)}`}
          />
        </div>

        <div className="mt-4 rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-4">
              <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                cadastros por {periodo === "mes" ? "mês" : periodo}
              </span>
              <span className="text-[12px] text-[var(--color-ink-faint)]">{janela}</span>
            </div>
            <div className="flex gap-1 rounded-full p-1" style={{ background: "var(--surface-2)" }}>
              {PERIODOS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriodo(p.key)}
                  className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
                  style={
                    periodo === p.key
                      ? { background: "var(--surface-1)", color: "var(--color-ink)" }
                      : { color: "var(--color-ink-soft)" }
                  }
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <Area pontos={serie} />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-[var(--color-ink-soft)]">
            <span><span className="tabular font-semibold text-[var(--color-ink)]">{n(gente.novos7)}</span> nos últimos 7 dias</span>
            <span><span className="tabular font-semibold text-[var(--color-ink)]">{n(gente.novos30)}</span> nos últimos 30 dias</span>
            <span><span className="tabular font-semibold text-[var(--color-ink)]">{n(gente.novos90)}</span> nos últimos 90 dias</span>
            <span>
              {taxa === null ? (
                "poucos dados para uma taxa"
              ) : (
                <>
                  <span className="tabular font-semibold text-[var(--color-ink)]">{taxa > 0 ? "+" : ""}{taxa}%</span> contra os 30 dias anteriores
                </>
              )}
            </span>
          </div>
        </div>

        {/* O LOG DE CADASTRO. O e-mail está aqui, e não sai desta tela (o .md não leva e-mail). */}
        <div className="mt-4 overflow-x-auto rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
          <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            quem chegou, por último
          </div>
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
                  <td className="py-2 pr-4 text-[var(--color-ink-soft)]">
                    {c.metodo === "google" ? "google" : c.metodo === "email" ? "e-mail" : "outro"}
                  </td>
                  <td className="py-2 text-[var(--color-ink-soft)]">
                    {c.convidadoPor ? `veio por ${c.convidadoPor}` : "chegou sozinho"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloco>

      {/* ─────────────────────────────── USO */}
      <Bloco titulo="uso" desc="média mente, mediana não">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Kpi valor={um(uso.medianaLivros)} label="livros por pessoa" nota={`média ${um(uso.mediaLivros)}`} />
          <Kpi valor={um(uso.medianaLidos)} label="lidos por pessoa" nota={`média ${um(uso.mediaLidos)}`} />
          <Kpi valor={`${ativacao}%`} label="ativação" nota="tem ao menos 1 livro" destaque />
          <Kpi valor={n(uso.contasVazias)} label="contas vazias" />
          <Kpi valor={n(uso.resenhas)} label="resenhas escritas" />
        </div>

        <div className="mt-4 rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
          <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            as notas, em palavra
          </div>
          <div className="mt-4">
            <Distribuicao fatias={uso.notas} />
          </div>
        </div>

        <p className="mt-3 text-[12px] text-[var(--color-ink-faint)]">
          importações e exportações ainda não são contadas. Medir a saída é a próxima coisa aqui:
          ela é a promessa central e precisa ser vista funcionando.
        </p>
      </Bloco>

      {/* ─────────────────────────────── CONTRIBUIÇÃO */}
      <Bloco titulo="contribuição" desc="a tese do projeto">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi valor={`${fatiaContribui}%`} label="das contas contribuiu" nota="ao menos uma vez" destaque />
          <Kpi valor={n(contribuicao.correcoes30)} label="correções em 30 dias" nota={`${n(contribuicao.pessoasQueCorrigiram)} pessoas ao todo`} />
          <Kpi valor={n(contribuicao.capasEnviadas)} label="capas enviadas" />
          <Kpi valor={n(contribuicao.capasEsperando)} label="capas esperando" />
          <Kpi valor={n(contribuicao.obrasDeLeitor)} label="obras de leitor" />
          <Kpi
            valor={contribuicao.codigo === null ? "sem dado" : n(contribuicao.codigo)}
            label="escreveram código"
            nota={contribuicao.codigo === null ? "o github não respondeu" : undefined}
          />
        </div>
      </Bloco>

      {/* ─────────────────────────────── CONVITE */}
      <Bloco titulo="convite" desc="a única alavanca de crescimento">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border p-5 lg:col-span-1" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
            <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              como as contas chegaram
            </div>
            <div className="mt-5">
              <Divisao a={convite.porConvite} b={convite.sozinhos} rotuloA="por convite" rotuloB="sozinhos" />
            </div>
          </div>
          <Kpi valor={n(convite.quemJaConvidou)} label="pessoas já convidaram alguém" />
          <Kpi valor={n(convite.convitesQueVingaram)} label="convites viraram conta de verdade" destaque />
        </div>
      </Bloco>

      {/* ─────────────────────────────── CATÁLOGO */}
      <Bloco titulo="catálogo">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi valor={n(catalogo.obras)} label="obras" />
          <Kpi valor={n(catalogo.edicoes)} label="edições" />
          <Kpi valor={n(catalogo.semCapa)} label="edições sem capa" destaque />
          <Kpi valor={n(catalogo.semAno)} label="sem ano" />
          <Kpi valor={n(catalogo.semEditora)} label="sem editora" />
          <Kpi valor={n(catalogo.semAutor)} label="obras sem autor" />
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border p-5" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
          <div className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            procuraram e não acharam
          </div>
          {catalogo.buscasVazias.length === 0 ? (
            <p className="mt-3 text-[13px] text-[var(--color-ink-soft)]">
              ninguém bateu numa parede ainda, ou o catálogo deu conta.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {catalogo.buscasVazias.map((b) => (
                <span
                  key={b.termo}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[13px]"
                  style={{ borderColor: "var(--color-rule)" }}
                >
                  <span className="text-[var(--color-ink)]">{b.termo}</span>
                  <span className="tabular text-[11px] text-[var(--color-ink-faint)]">{b.quantas}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </Bloco>

      {/* ─────────────────────────────── AGENTE */}
      <Bloco titulo="para o seu Claude ler">
        <div className="rounded-2xl border p-5 text-[13px] leading-relaxed text-[var(--color-ink-soft)]" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
          <p>
            O botão <span className="font-medium text-[var(--color-ink)]">copiar para o Claude</span> lá em cima copia
            tudo isto em texto, pronto para colar numa conversa. O <span className="font-medium text-[var(--color-ink)]">baixar .md</span> salva o mesmo arquivo.
          </p>
          <p className="mt-3">
            Para um agente ler sozinho, sem você por perto, defina um segredo em <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[12px]">PAINEL_TOKEN</code> e
            deixe o agente buscar assim:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl p-3 text-[12px]" style={{ background: "var(--surface-2)", color: "var(--color-ink)" }}>
{`curl -H "authorization: Bearer $PAINEL_TOKEN" \\
  ${typeof window !== "undefined" ? window.location.origin : ""}/api/painel/export?formato=md`}
          </pre>
          <p className="mt-3 text-[12px] text-[var(--color-ink-faint)]">
            O arquivo não leva e-mail de ninguém: só os números e os apelidos, que já são públicos. Troque
            <code className="mx-1 rounded bg-[var(--surface-2)] px-1.5 py-0.5">formato=md</code>por
            <code className="mx-1 rounded bg-[var(--surface-2)] px-1.5 py-0.5">formato=json</code>se o agente preferir dado estruturado.
          </p>
        </div>
      </Bloco>
    </main>
  );
}
