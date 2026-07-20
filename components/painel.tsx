import type { Painel as Dados, Ponto, Fatia } from "@/lib/painel";

/**
 * ════════════════════════════════════════════════════════════════════
 *  O PAINEL, EM PRETO E BRANCO.
 *
 *  Monocromático, como manda o docs/design.md: sem cor de destaque, sem
 *  gradiente, sem card colorido, sem emoji. O laranja já foi recusado na
 *  página de estatísticas, e aqui a regra é a mesma. Números grandes,
 *  rótulos pequenos, e poucos números que o dono vai olhar todo dia em vez
 *  de todos os números possíveis.
 *
 *  Esta tela fala com o DONO, e por isso usa palavras que o resto do app não
 *  pode usar (retenção, coorte, mediana). Ela está na exceção de
 *  lib/voice.test.ts, explícita e comentada, e a regra global continua valendo
 *  para todo o resto.
 * ════════════════════════════════════════════════════════════════════
 */

/** Um número grande com um rótulo pequeno. O tijolo da página. */
function Numero({ n, label, sub }: { n: string | number; label: string; sub?: string }) {
  return (
    <div>
      <div className="voice tabular text-4xl leading-none">{n}</div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {label}
      </div>
      {sub && <div className="mt-1 text-[12px] text-[var(--color-ink-faint)]">{sub}</div>}
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <h2 className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
        {titulo}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** As barras do crescimento. Uma cor só, altura pela contagem. Sem eixo, sem legenda. */
function Barras({ pontos }: { pontos: Ponto[] }) {
  const teto = Math.max(1, ...pontos.map((p) => p.n));
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 80 }}>
      {pontos.map((p) => (
        <div
          key={p.chave}
          title={`${p.chave}: ${p.n}`}
          className="min-w-[2px] flex-1 rounded-[2px] bg-[var(--color-ink)]"
          style={{ height: `${Math.max(2, (p.n / teto) * 100)}%`, opacity: 0.85 }}
        />
      ))}
    </div>
  );
}

/** Uma distribuição em linhas: rótulo, barra, número. Para as notas. */
function Distribuicao({ fatias }: { fatias: Fatia[] }) {
  const teto = Math.max(1, ...fatias.map((f) => f.n));
  return (
    <div className="flex flex-col gap-2">
      {fatias.map((f) => (
        <div key={f.rotulo} className="flex items-center gap-3">
          <div className="w-28 shrink-0 text-[13px] text-[var(--color-ink-soft)]">{f.rotulo}</div>
          <div className="h-2 flex-1 rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--color-ink)]"
              style={{ width: `${(f.n / teto) * 100}%`, opacity: 0.85 }}
            />
          </div>
          <div className="tabular w-12 shrink-0 text-right text-[13px] text-[var(--color-ink-soft)]">
            {f.n}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * A taxa de um período contra o anterior, dita com honestidade sobre o tamanho.
 *
 * Sair de 1 para 4 é "+300%", e "+300%" não significa nada quando a base é minúscula.
 * Então abaixo de um piso a página diz "poucos dados ainda" em vez de mentir com um número.
 */
function Taxa({ agora, antes }: { agora: number; antes: number }) {
  if (antes < 10) {
    return <span className="text-[13px] text-[var(--color-ink-faint)]">poucos dados ainda</span>;
  }
  const pct = Math.round(((agora - antes) / antes) * 100);
  const sinal = pct > 0 ? "+" : "";
  return (
    <span className="tabular text-[13px] text-[var(--color-ink-soft)]">
      {sinal}
      {pct}% contra os 30 dias anteriores
    </span>
  );
}

const NF = new Intl.NumberFormat("pt-BR");
const n = (x: number) => NF.format(x);
const umaCasa = (x: number) => x.toFixed(1).replace(".", ",");

export function Painel({ dados }: { dados: Dados }) {
  const { gente, uso, contribuicao, convite, catalogo } = dados;

  const totalContribuivel = gente.total;
  const fatiaContribui =
    totalContribuivel > 0 ? Math.round((contribuicao.contribuintes / totalContribuivel) * 100) : 0;

  return (
    <main className="mx-auto max-w-4xl px-6 pb-32 sm:px-10">
      <h1 className="voice mt-16 text-[40px] leading-[1.05] tracking-[-0.015em] sm:mt-20">
        O Gume, por dentro
      </h1>
      <p className="mt-3 text-[14px] text-[var(--color-ink-soft)]">
        Só você vê esta página. Os números de verdade, para saber se isto está vivo.
      </p>

      {/* ─────────────────────────────── GENTE */}
      <Secao titulo="gente">
        <div className="flex flex-wrap gap-x-12 gap-y-8">
          <Numero n={n(gente.total)} label="contas" />
          <Numero n={n(gente.novos7)} label="nos últimos 7 dias" />
          <Numero
            n={n(gente.novos30)}
            label="nos últimos 30 dias"
            sub={undefined}
          />
          <Numero n={n(gente.ativos7)} label="ativos em 7 dias" />
          <Numero n={n(gente.ativos30)} label="ativos em 30 dias" />
        </div>

        <div className="mt-3">
          <Taxa agora={gente.novos30} antes={gente.novos30Anterior} />
        </div>

        <div className="surface mt-8 p-6">
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            cadastros por dia, últimos 30
          </div>
          <div className="mt-4">
            <Barras pontos={gente.porDia} />
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="surface p-6">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              por semana, últimas 12
            </div>
            <div className="mt-4">
              <Barras pontos={gente.porSemana} />
            </div>
          </div>
          <div className="surface p-6">
            <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              por mês, últimos 12
            </div>
            <div className="mt-4">
              <Barras pontos={gente.porMes} />
            </div>
          </div>
        </div>

        {/* RETENÇÃO. A que mais dói, e a que mais importa. Com honestidade sobre o tamanho:
            enquanto pouca gente teve chance de voltar, a página diz isso em vez de um número. */}
        <div className="surface mt-6 p-6">
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            retenção: voltaram depois da primeira semana
          </div>
          {gente.coorteMadura < 20 ? (
            <p className="mt-3 text-[14px] text-[var(--color-ink-soft)]">
              poucos dados ainda. {n(gente.retidos)} de {n(gente.coorteMadura)} contas que já
              tiveram tempo de voltar. O número só significa alguma coisa quando essa base cresce.
            </p>
          ) : (
            <div className="mt-3 flex items-end gap-4">
              <div className="voice tabular text-4xl leading-none">
                {Math.round((gente.retidos / gente.coorteMadura) * 100)}%
              </div>
              <div className="pb-1 text-[13px] text-[var(--color-ink-soft)]">
                {n(gente.retidos)} de {n(gente.coorteMadura)} que tiveram a chance
              </div>
            </div>
          )}
        </div>

        {/* O LOG DE CADASTRO. O e-mail está aqui e não sai desta página. */}
        <div className="surface mt-6 overflow-x-auto p-6">
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            quem chegou, por último
          </div>
          <table className="mt-4 w-full text-[13px]">
            <tbody>
              {gente.log.map((c) => (
                <tr key={c.handle} className="border-t border-[var(--color-rule)]">
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
      </Secao>

      {/* ─────────────────────────────── USO */}
      <Secao titulo="uso">
        <div className="flex flex-wrap gap-x-12 gap-y-8">
          <Numero
            n={umaCasa(uso.medianaLivros)}
            label="livros na estante, mediana"
            sub={`média ${umaCasa(uso.mediaLivros)}`}
          />
          <Numero
            n={umaCasa(uso.medianaLidos)}
            label="lidos por pessoa, mediana"
            sub={`média ${umaCasa(uso.mediaLidos)}`}
          />
          <Numero n={n(uso.contasVazias)} label="contas vazias" />
          <Numero n={n(uso.resenhas)} label="resenhas escritas" />
        </div>

        <div className="surface mt-8 p-6">
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            as notas, em palavra
          </div>
          <div className="mt-4">
            <Distribuicao fatias={uso.notas} />
          </div>
        </div>

        <p className="mt-4 text-[13px] text-[var(--color-ink-faint)]">
          importações e exportações ainda não são contadas. Medir isso é a próxima coisa a
          fazer aqui, porque a saída é a promessa central e precisa ser vista funcionando.
        </p>
      </Secao>

      {/* ─────────────────────────────── CONTRIBUIÇÃO */}
      <Secao titulo="contribuição">
        <div className="flex flex-wrap gap-x-12 gap-y-8">
          <Numero n={`${fatiaContribui}%`} label="das contas contribuiu ao menos uma vez" />
          <Numero n={n(contribuicao.correcoes30)} label="correções nos últimos 30 dias" />
          <Numero n={n(contribuicao.pessoasQueCorrigiram)} label="pessoas que corrigiram" />
          <Numero n={n(contribuicao.capasEnviadas)} label="capas enviadas" />
          <Numero n={n(contribuicao.capasEsperando)} label="capas esperando conferência" />
          <Numero n={n(contribuicao.obrasDeLeitor)} label="obras que leitores cadastraram" />
          <Numero
            n={contribuicao.codigo === null ? "sem dado" : n(contribuicao.codigo)}
            label="escreveram código"
            sub={contribuicao.codigo === null ? "o github não respondeu agora" : undefined}
          />
        </div>
      </Secao>

      {/* ─────────────────────────────── CONVITE */}
      <Secao titulo="convite">
        <div className="flex flex-wrap gap-x-12 gap-y-8">
          <Numero n={n(convite.porConvite)} label="chegaram por convite" />
          <Numero n={n(convite.sozinhos)} label="chegaram sozinhos" />
          <Numero n={n(convite.quemJaConvidou)} label="pessoas já convidaram alguém" />
          <Numero n={n(convite.convitesQueVingaram)} label="convites viraram conta de verdade" />
        </div>
      </Secao>

      {/* ─────────────────────────────── CATÁLOGO */}
      <Secao titulo="catálogo">
        <div className="flex flex-wrap gap-x-12 gap-y-8">
          <Numero n={n(catalogo.obras)} label="obras" />
          <Numero n={n(catalogo.edicoes)} label="edições" />
          <Numero n={n(catalogo.semCapa)} label="edições sem capa" />
          <Numero n={n(catalogo.semAno)} label="sem ano" />
          <Numero n={n(catalogo.semEditora)} label="sem editora" />
          <Numero n={n(catalogo.semAutor)} label="obras sem autor" />
        </div>

        <div className="surface mt-8 overflow-x-auto p-6">
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            procuraram e não acharam
          </div>
          {catalogo.buscasVazias.length === 0 ? (
            <p className="mt-3 text-[14px] text-[var(--color-ink-soft)]">
              ninguém bateu numa parede ainda, ou o catálogo deu conta.
            </p>
          ) : (
            <table className="mt-4 w-full text-[13px]">
              <tbody>
                {catalogo.buscasVazias.map((b) => (
                  <tr key={b.termo} className="border-t border-[var(--color-rule)]">
                    <td className="py-2 pr-4 text-[var(--color-ink)]">{b.termo}</td>
                    <td className="tabular py-2 text-right text-[var(--color-ink-faint)]">
                      {b.quantas === 1 ? "1 vez" : `${b.quantas} vezes`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Secao>
    </main>
  );
}
