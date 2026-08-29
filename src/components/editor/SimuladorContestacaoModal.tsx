"use client";

import React, { useState } from "react";
import {
  Swords,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FilePlus2,
  CheckCircle2,
  Loader2,
  X,
  Sparkles,
  Info,
  Scale,
} from "lucide-react";
import type { DefenseSimulationResult } from "@/app/api/gemini/simulate-defense/route";

interface SimuladorContestacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  editorHtml: string;
  onInsertBlindagem: (titulo: string, paragrafos: string[]) => void;
}

export function SimuladorContestacaoModal({
  isOpen,
  onClose,
  editorHtml,
  onInsertBlindagem,
}: SimuladorContestacaoModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DefenseSimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preliminares" | "merito" | "vulnerabilidades" | "blindagem">("preliminares");
  const [insertedTopics, setInsertedTopics] = useState<Set<string>>(new Set());

  const handleSimular = async () => {
    if (!editorHtml || editorHtml.trim().length < 50) {
      setError("O documento precisa ter conteúdo para ser analisado.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gemini/simulate-defense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: editorHtml }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || "Falha ao gerar a simulação.");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Erro ao conectar com a IA.");
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = (topico: { tituloTopico: string; paragrafos: string[] }) => {
    onInsertBlindagem(topico.tituloTopico, topico.paragrafos);
    setInsertedTopics((prev) => new Set(prev).add(topico.tituloTopico));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Swords className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Simulador de Contestação</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  Auditoria Adversarial
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Projeção de preliminares e teses defensivas da Ré para blindagem processual
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!result && !loading && (
            <div className="text-center py-12 space-y-4">
              <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
                <ShieldAlert className="size-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h4 className="text-base font-semibold text-foreground">
                  Auditar Vulnerabilidades e Preliminares
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Uma IA especializada em Direito Processual e Estratégia de Defesa irá dissecar sua
                  petição, prevendo as preliminares (art. 337 do CPC), teses de mérito e brechas probatórias
                  para blindar sua peça antes do protocolo.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 max-w-md mx-auto">
                  {error}
                </div>
              )}

              <button
                onClick={handleSimular}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Swords className="size-4" />
                <span>Iniciar Simulação Adversarial</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-16 space-y-3">
              <Loader2 className="size-8 animate-spin text-amber-500 mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                Dissecando petição e redigindo contra-ataque...
              </p>
              <p className="text-xs text-muted-foreground">
                Analisando preliminares do art. 337 do CPC e jurisprudência defensiva.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Score & Resumo */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Diagnóstico Geral de Risco:</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {result.resumoRisco}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 bg-card p-3 rounded-xl border border-border">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-medium">Índice de Blindagem</div>
                    <div className="text-lg font-extrabold text-amber-500">
                      {result.pontuacaoBlindagem}/100
                    </div>
                  </div>
                  <ShieldCheck className="size-8 text-amber-500" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border gap-2 text-xs">
                <button
                  onClick={() => setActiveTab("preliminares")}
                  className={`pb-2 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                    activeTab === "preliminares"
                      ? "border-amber-500 text-amber-500"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Preliminares ({result.preliminaresProvaveis?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("merito")}
                  className={`pb-2 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                    activeTab === "merito"
                      ? "border-amber-500 text-amber-500"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Teses de Mérito ({result.tesesMeritoRe?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("vulnerabilidades")}
                  className={`pb-2 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                    activeTab === "vulnerabilidades"
                      ? "border-amber-500 text-amber-500"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Provas & Brechas ({result.vulnerabilidadesProbatorias?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("blindagem")}
                  className={`pb-2 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                    activeTab === "blindagem"
                      ? "border-emerald-500 text-emerald-500"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Blindagens Preventivas ({result.paragrafosBlindagemSugeridos?.length || 0})
                </button>
              </div>

              {/* Tab: Preliminares */}
              {activeTab === "preliminares" && (
                <div className="space-y-3">
                  {result.preliminaresProvaveis?.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5 text-amber-500" />
                          {p.titulo}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                            {p.artigoCPC}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.probabilidade === "alta"
                                ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            }`}
                          >
                            Probabilidade {p.probabilidade.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">{p.explicacao}</p>

                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border text-xs space-y-1">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <ShieldCheck className="size-3.5 text-emerald-500" />
                          Estratégia de Neutralização:
                        </span>
                        <p className="text-muted-foreground pl-4">{p.estrategiaBlindagem}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Mérito */}
              {activeTab === "merito" && (
                <div className="space-y-3">
                  {result.tesesMeritoRe?.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2"
                    >
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Scale className="size-3.5 text-amber-500" />
                        {m.tese}
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Argumento da Ré:</strong> {m.argumentoProvavel}
                      </p>
                      <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                        <strong className="text-emerald-600 dark:text-emerald-400">Contraponto Recomendado:</strong>{" "}
                        <span className="text-muted-foreground">{m.contrapontoSugerido}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Vulnerabilidades */}
              {activeTab === "vulnerabilidades" && (
                <div className="space-y-2">
                  {result.vulnerabilidadesProbatorias?.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border/80 bg-background/50 flex items-start gap-2.5 text-xs text-muted-foreground"
                    >
                      <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Blindagens Sugeridas */}
              {activeTab === "blindagem" && (
                <div className="space-y-4">
                  {result.paragrafosBlindagemSugeridos?.map((b, idx) => {
                    const isInserted = insertedTopics.has(b.tituloTopico);

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <Sparkles className="size-3.5 text-emerald-500" />
                            {b.tituloTopico}
                          </span>

                          <button
                            onClick={() => handleInsert(b)}
                            disabled={isInserted}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isInserted
                                ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 cursor-default"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm active:scale-95"
                            }`}
                          >
                            {isInserted ? (
                              <>
                                <CheckCircle2 className="size-3.5" />
                                <span>Inserido</span>
                              </>
                            ) : (
                              <>
                                <FilePlus2 className="size-3.5" />
                                <span>Inserir na Petição</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="space-y-2 text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-emerald-500/40">
                          {b.paragrafos.map((p, pIdx) => (
                            <p key={pIdx}>{p}</p>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20 text-xs">
          <span className="text-muted-foreground text-[11px]">
            SmartDoc Adversarial Defense Engine
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-semibold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
