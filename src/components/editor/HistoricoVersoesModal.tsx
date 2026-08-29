"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  RotateCcw,
  Clock,
  Sparkles,
  User,
  CheckCircle2,
  FileText,
  X,
  Eye,
} from "lucide-react";

export interface DocumentVersion {
  id: string;
  timestamp: number;
  label: string;
  source: "ai" | "human" | "initial";
  html: string;
  wordCount?: number;
}

interface HistoricoVersoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHtml: string;
  onRestoreVersion: (html: string) => void;
}

export function HistoricoVersoesModal({
  isOpen,
  onClose,
  currentHtml,
  onRestoreVersion,
}: HistoricoVersoesModalProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    try {
      const stored = localStorage.getItem("smartdoc_version_history");
      let list: DocumentVersion[] = stored ? JSON.parse(stored) : [];

      // Se a lista estiver vazia, cria uma versão base atual
      if (list.length === 0 && currentHtml) {
        const initialVer: DocumentVersion = {
          id: `ver-${Date.now()}`,
          timestamp: Date.now(),
          label: "Versão Inicial",
          source: "initial",
          html: currentHtml,
          wordCount: currentHtml.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length,
        };
        list = [initialVer];
        localStorage.setItem("smartdoc_version_history", JSON.stringify(list));
      }

      setVersions(list);
      if (list.length > 0) {
        setSelectedVersionId(list[list.length - 1].id);
      }
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
    }
  }, [isOpen, currentHtml]);

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) || versions[versions.length - 1];

  const handleRestore = (ver: DocumentVersion) => {
    if (confirm(`Deseja restaurar a versão "${ver.label}" (${new Date(ver.timestamp).toLocaleTimeString()})?`)) {
      onRestoreVersion(ver.html);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <History className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Timeline & Histórico de Versões</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
                  {versions.length} {versions.length === 1 ? "versão" : "versões"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rastreabilidade completa de todas as alterações manuais e cirurgias de IA
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
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Timeline List */}
          <div className="w-80 border-r border-border overflow-y-auto p-4 space-y-2 bg-muted/10">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Pontos de Restauração
            </div>

            {versions.slice().reverse().map((ver, idx) => {
              const isSelected = ver.id === selectedVersion?.id;
              const dateStr = new Date(ver.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersionId(ver.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? "bg-blue-500/10 border-blue-500/40 shadow-sm"
                      : "bg-card hover:bg-muted/40 border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5 truncate">
                      {ver.source === "ai" ? (
                        <Sparkles className="size-3.5 text-amber-500 shrink-0" />
                      ) : ver.source === "initial" ? (
                        <FileText className="size-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <User className="size-3.5 text-blue-500 shrink-0" />
                      )}
                      <span className="truncate">{ver.label}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {dateStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="capitalize">{ver.source === "ai" ? "Revisão por IA" : ver.source === "initial" ? "Criação" : "Edição Manual"}</span>
                    {ver.wordCount && <span>{ver.wordCount} palavras</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Preview Area */}
          <div className="flex-1 flex flex-col bg-background overflow-hidden">
            {selectedVersion ? (
              <>
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/20 text-xs">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">Visualizando: {selectedVersion.label}</span>
                    <span className="text-muted-foreground">
                      ({new Date(selectedVersion.timestamp).toLocaleString()})
                    </span>
                  </div>

                  <button
                    onClick={() => handleRestore(selectedVersion)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Restaurar Esta Versão</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-card text-foreground">
                  <div
                    className="prose dark:prose-invert max-w-none text-xs leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedVersion.html }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                Selecione uma versão para visualizar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
