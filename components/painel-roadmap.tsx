"use client";

import { useState, useTransition } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus } from "lucide-react";
import {
  criarItemAction, editarItemAction, mudarStatusAction, reordenarItensAction, apagarItemAction,
} from "@/app/painel/actions";
import { toast } from "@/lib/toast";
import { Bloco } from "@/components/painel";
import { Campo } from "@/components/campo";
import { LIMITS } from "@/lib/limits";
import { STATUS_LABEL, type RoadmapItem, type RoadmapStatus } from "@/lib/roadmap-view";

/**
 * ════════════════════════════════════════════════════════════════════
 *  A ABA "ROADMAP". Cria, edita, reordena, muda status, apaga — sem sair do painel.
 *
 *  ═══ VOTOS INFORMAM. ELES NÃO DECIDEM (ai/PRD.md) ═══
 *
 *  O número de votos aparece ao lado de cada item, mas a ORDEM é sempre a que o dono
 *  arrastou aqui (as setas ↑↓, gravadas em `position`). Não existe "ordenar por
 *  voto" nesta tela, de propósito: o dia em que existisse, esta lista pararia de
 *  ser uma decisão do dono e viraria um placar.
 *
 *  ═══ REORDENAR É LOCAL, DEPOIS GRAVA ═══
 *
 *  As setas trocam dois itens de lugar na hora (sem esperar o servidor: é uma
 *  ferramenta do dono, não precisa da cautela de otimismo que uma tela pública
 *  precisaria) e mandam a lista inteira do status pra `reordenarItensAction`, que
 *  grava a posição de cada um numa passada.
 * ════════════════════════════════════════════════════════════════════
 */

const TODOS_OS_STATUS: RoadmapStatus[] = ["em_andamento", "planejado", "ideia", "lancado"];

const inputClasse =
  "w-full rounded-xl border bg-[var(--surface-2)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-ink)]";

export function PainelRoadmap({ itens }: { itens: RoadmapItem[] }) {
  const [pendente, comecar] = useTransition();
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novoStatus, setNovoStatus] = useState<RoadmapStatus>("ideia");
  const [editando, setEditando] = useState<string | null>(null);
  const [tituloEdicao, setTituloEdicao] = useState("");
  const [descricaoEdicao, setDescricaoEdicao] = useState("");
  const [apagando, setApagando] = useState<string | null>(null);

  const criar = () => {
    const titulo = novoTitulo.trim();
    if (!titulo) return;
    comecar(async () => {
      await criarItemAction(titulo, novaDescricao, novoStatus);
      setNovoTitulo("");
      setNovaDescricao("");
      toast("Item criado.");
    });
  };

  const iniciarEdicao = (item: RoadmapItem) => {
    setEditando(item.id);
    setTituloEdicao(item.title);
    setDescricaoEdicao(item.description ?? "");
  };

  const salvarEdicao = (id: string) => {
    const titulo = tituloEdicao.trim();
    if (!titulo) return;
    comecar(async () => {
      await editarItemAction(id, titulo, descricaoEdicao);
      setEditando(null);
      toast("Item salvo.");
    });
  };

  const mudarStatus = (id: string, status: RoadmapStatus) => {
    comecar(() => mudarStatusAction(id, status));
  };

  const mover = (lista: RoadmapItem[], status: RoadmapStatus, id: string, direcao: -1 | 1) => {
    const i = lista.findIndex((it) => it.id === id);
    const j = i + direcao;
    if (i < 0 || j < 0 || j >= lista.length) return;
    const nova = [...lista];
    [nova[i], nova[j]] = [nova[j]!, nova[i]!];
    comecar(() => reordenarItensAction(status, nova.map((it) => it.id)));
  };

  const apagar = (id: string) => {
    comecar(async () => {
      await apagarItemAction(id);
      setApagando(null);
      toast("Item apagado.");
    });
  };

  return (
    <div style={{ opacity: pendente ? 0.6 : 1, transition: "opacity .15s" }}>
      <Bloco titulo="novo item" desc="nasce no fim da fila do status escolhido">
        <div className="flex flex-col gap-3 rounded-2xl border p-4" style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}>
          <Campo
            valor={novoTitulo}
            aoMudar={setNovoTitulo}
            teto={LIMITS.title}
            placeholder="título"
            className={inputClasse}
          />
          <Campo
            valor={novaDescricao}
            aoMudar={setNovaDescricao}
            teto={LIMITS.description}
            linhas={2}
            placeholder="descrição (opcional, uma ideia pode ser só o título)"
            className={inputClasse}
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as RoadmapStatus)}
              className="rounded-xl border bg-[var(--surface-2)] px-3 py-2 text-[13px]"
              style={{ borderColor: "var(--color-rule)" }}
            >
              {TODOS_OS_STATUS.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button
              onClick={criar}
              disabled={!novoTitulo.trim() || pendente}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium disabled:opacity-50"
              style={{ background: "var(--color-ink)", color: "var(--color-canvas)" }}
            >
              <Plus size={14} strokeWidth={2} />
              criar
            </button>
          </div>
        </div>
      </Bloco>

      {TODOS_OS_STATUS.map((status) => {
        const lista = itens.filter((i) => i.status === status);
        return (
          <Bloco key={status} titulo={STATUS_LABEL[status]} desc={`${lista.length} ${lista.length === 1 ? "item" : "itens"}`}>
            {lista.length === 0 ? (
              <p className="text-[13px] text-[var(--color-ink-soft)]">nada aqui.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {lista.map((item, i) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border p-4"
                    style={{ borderColor: "var(--color-rule)", background: "var(--surface-1)" }}
                  >
                    {editando === item.id ? (
                      <div className="flex flex-col gap-2">
                        <Campo
                          autoFocus
                          valor={tituloEdicao}
                          aoMudar={setTituloEdicao}
                          teto={LIMITS.title}
                          className={inputClasse}
                        />
                        <Campo
                          valor={descricaoEdicao}
                          aoMudar={setDescricaoEdicao}
                          teto={LIMITS.description}
                          linhas={2}
                          className={inputClasse}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => salvarEdicao(item.id)}
                            className="rounded-full px-3 py-1.5 text-[12px] font-medium"
                            style={{ background: "var(--color-ink)", color: "var(--color-canvas)" }}
                          >
                            salvar
                          </button>
                          <button
                            onClick={() => setEditando(null)}
                            className="rounded-full border px-3 py-1.5 text-[12px]"
                            style={{ borderColor: "var(--color-rule)", color: "var(--color-ink-soft)" }}
                          >
                            cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <button onClick={() => iniciarEdicao(item)} className="text-left">
                            <p className="text-[14px] font-medium text-[var(--color-ink)]">{item.title}</p>
                            {item.description && (
                              <p className="mt-1 text-[13px] text-[var(--color-ink-soft)]">{item.description}</p>
                            )}
                          </button>
                          <span className="tabular shrink-0 text-[12px] text-[var(--color-ink-faint)]">
                            {item.votos} {item.votos === 1 ? "voto" : "votos"}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => mover(lista, status, item.id, -1)}
                            disabled={i === 0}
                            className="rounded-full border p-1.5 disabled:opacity-30"
                            style={{ borderColor: "var(--color-rule)" }}
                          >
                            <ChevronUp size={14} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => mover(lista, status, item.id, 1)}
                            disabled={i === lista.length - 1}
                            className="rounded-full border p-1.5 disabled:opacity-30"
                            style={{ borderColor: "var(--color-rule)" }}
                          >
                            <ChevronDown size={14} strokeWidth={2} />
                          </button>

                          <select
                            value={status}
                            onChange={(e) => mudarStatus(item.id, e.target.value as RoadmapStatus)}
                            className="rounded-full border px-3 py-1.5 text-[12px]"
                            style={{ borderColor: "var(--color-rule)", background: "var(--surface-2)" }}
                          >
                            {TODOS_OS_STATUS.map((s) => (
                              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                            ))}
                          </select>

                          {apagando === item.id ? (
                            <span className="flex items-center gap-2 text-[12px]">
                              <button
                                onClick={() => apagar(item.id)}
                                className="rounded-full px-3 py-1.5 font-medium"
                                style={{ background: "var(--color-perigo, #b3543f)", color: "white" }}
                              >
                                confirmar
                              </button>
                              <button onClick={() => setApagando(null)} className="text-[var(--color-ink-soft)]">
                                cancelar
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setApagando(item.id)}
                              className="ml-auto rounded-full border p-1.5"
                              style={{ borderColor: "var(--color-rule)", color: "var(--color-ink-faint)" }}
                            >
                              <Trash2 size={14} strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Bloco>
        );
      })}
    </div>
  );
}
