"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Loader2,
  Sparkles,
  Scale,
  FileCode2,
  Gavel,
  GraduationCap,
  Info,
} from "lucide-react";

export type TipoDispositivo = "artigo" | "sumula" | "tema" | "jurisprudencia" | "doutrina" | "lei";

export interface Dispositivo {
  id: string;
  tipo: TipoDispositivo;
  codigo: string;
  fonte: string;
  url?: string;
  status?: "valid" | "warning" | "hallucination";
  veredito?: string;
  explicacao?: string;
  sugestao?: string;
}

interface DispositivosMapeadosProps {
  editorHtml: string;
}

interface RegraDispositivo {
  pattern: RegExp;
  tipo: TipoDispositivo;
  fonte: (m: RegExpMatchArray) => string;
  url?: (m: RegExpMatchArray) => string | undefined;
}

const REGRAS: RegraDispositivo[] = [
  // CÓDIGO CIVIL
  {
    pattern: /(?:Art\.?|Artigo)\s*\d+[\u00b0\u00ba]?(?:[,;]?\s*\u00a7\s*\d+[\u00b0\u00ba]?)?(?:[,;]?\s*(?:inc\.?|inciso)\s*[IVXLC]+)?(?:\s*,\s*caput)?(?:\s*,\s*(?:parágrafo|§)\s*único)?\s+(?:d[ao]s?\s+)?(?:C[oó]digo\s+Civil|CC(?:\/02)?)\b/gi,
    tipo: "artigo",
    fonte: (m) => m[0].trim(),
    url: () => "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
  },
  // CDC
  {
    pattern: /(?:Art\.?|Artigo)\s*\d+[\u00b0\u00ba]?(?:[,;]?\s*\u00a7\s*\d+[\u00b0\u00ba]?)?(?:[,;]?\s*(?:inc\.?|inciso)\s*[IVXLC]+)?(?:\s*,\s*caput)?(?:\s*,\s*(?:parágrafo|§)\s*único)?\s+(?:d[ao]s?\s+)?(?:C[oó]digo\s+de\s+Defesa\s+do\s+Consumidor|CDC)\b/gi,
    tipo: "artigo",
    fonte: (m) => m[0].trim(),
    url: () => "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
  },
  // CPC
  {
    pattern: /(?:Art\.?|Artigo)\s*\d+[\u00b0\u00ba]?(?:[,;]?\s*\u00a7\s*\d+[\u00b0\u00ba]?)?(?:[,;]?\s*(?:inc\.?|inciso)\s*[IVXLC]+)?(?:\s*,\s*caput)?(?:\s*,\s*(?:parágrafo|§)\s*único)?\s+(?:d[ao]s?\s+)?(?:C[oó]digo\s+de\s+Processo\s+Civil|CPC(?:\/15)?)\b/gi,
    tipo: "artigo",
    fonte: (m) => m[0].trim(),
    url: () => "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105compilado.htm",
  },
  // CONSTITUIÇÃO FEDERAL
  {
    pattern: /(?:Art\.?|Artigo)\s*\d+[\u00b0\u00ba]?(?:[,;]?\s*\u00a7\s*\d+[\u00b0\u00ba]?)?(?:[,;]?\s*(?:inc\.?|inciso)\s*[IVXLC]+)?(?:\s*,\s*caput)?\s+(?:d[ao]s?\s+)?(?:Constitui[cç][aã]o(?:\s+Federal)?|CF(?:\/88)?|CRFB(?:\/88)?)\b/gi,
    tipo: "artigo",
    fonte: (m) => m[0].trim(),
    url: () => "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
  },
  // CLT
  {
    pattern: /(?:Art\.?|Artigo)\s*\d+[\u00b0\u00ba]?(?:[,;]?\s*\u00a7\s*\d+[\u00b0\u00ba]?)?(?:[,;]?\s*(?:inc\.?|inciso)\s*[IVXLC]+)?\s+(?:d[ao]s?\s+)?(?:Consolida[cç][aã]o\s+das\s+Leis\s+do\s+Trabalho|CLT)\b/gi,
    tipo: "artigo",
    fonte: (m) => m[0].trim(),
    url: () => "https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm",
  },
  // CÓDIGO PENAL / CPP
  {
    pattern: /(?:Art\.?|Artigo)\s*\d+[\u00b0\u00ba]?(?:[,;]?\s*\u00a7\s*\d+[\u00b0\u00ba]?)?(?:[,;]?\s*(?:inc\.?|inciso)\s*[IVXLC]+)?\s+(?:d[ao]s?\s+)?(?:C[oó]digo\s+Penal|CP|C[oó]digo\s+de\s+Processo\s+Penal|CPP)\b/gi,
    tipo: "artigo",
    fonte: (m) => m[0].trim(),
    url: () => "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
  },
  // CTN
  {
    pattern: /(?:Art\.?|Artigo)\s*\d+[\u00b0\u00ba]?(?:[,;]?\s*\u00a7\s*\d+[\u00b0\u00ba]?)?\s+(?:d[ao]s?\s+)?(?:C[oó]digo\s+Tribut[aá]rio\s+Nacional|CTN)\b/gi,
    tipo: "artigo",
    fonte: (m) => m[0].trim(),
    url: () => "https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm",
  },
  // SÚMULAS STJ
  {
    pattern: /S[uú]mula\s+(?:n[oº°]?\.?\s*)?(\d+)\s+(?:d[ao]\s+)?STJ\b/gi,
    tipo: "sumula",
    fonte: (m) => `Súmula ${m[1]} do STJ`,
    url: () => "https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/sumulas.aspx",
  },
  // SÚMULAS STF / SÚMULA VINCULANTE
  {
    pattern: /S[uú]mula\s+(?:Vinculante\s+)?(?:n[oº°]?\.?\s*)?(\d+)\s+(?:d[ao]\s+)?STF\b/gi,
    tipo: "sumula",
    fonte: (m) => m[0].includes("Vinculante") ? `Súmula Vinculante ${m[1]} do STF` : `Súmula ${m[1]} do STF`,
    url: () => "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp",
  },
  // SÚMULA VINCULANTE (sem menção expressa de STF)
  {
    pattern: /S[uú]mula\s+Vinculante\s+(?:n[oº°]?\.?\s*)?(\d+)\b/gi,
    tipo: "sumula",
    fonte: (m) => `Súmula Vinculante ${m[1]} (STF)`,
    url: () => "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp",
  },
  // TEMAS REPETITIVOS / REPERCUSSÃO GERAL
  {
    pattern: /Tema\s+(?:Repetitivo\s+|de\s+Repercuss[aã]o\s+Geral\s+)?(?:n[oº°]?\.?\s*)?(\d+)\s+(?:d[ao]\s+)?(STJ|STF)\b/gi,
    tipo: "tema",
    fonte: (m) => `Tema ${m[1]} do ${m[2].toUpperCase()}`,
    url: (m) => m[2].toUpperCase() === "STF" ? "https://portal.stf.jus.br/jurisprudencia/repercussaoGeral.asp" : "https://processo.stj.jus.br/repetitivos/",
  },
  // JURISPRUDÊNCIA / ACÓRDÃOS (REsp, RE, AgInt, AREsp, HC, ADI)
  {
    pattern: /(?:REsp|RE|AgInt\s+no\s+REsp|AREsp|HC|ADI|MS)\s+(?:n[oº°]?\.?\s*)?(\d[\d.]+(?:\/[A-Z]{2})?)\b/gi,
    tipo: "jurisprudencia",
    fonte: (m) => m[0].trim(),
    url: (m) => {
      const upper = m[0].toUpperCase();
      if (upper.includes("RESP") || upper.includes("ARESP")) return "https://processo.stj.jus.br/processo/pesquisa/";
      if (upper.includes("RE ") || upper.includes("ADI")) return "https://portal.stf.jus.br/jurisprudencia/";
      return undefined;
    },
  },
  // DOUTRINA
  {
    pattern: /(?:conforme\s+leciona|segundo\s+ensina|na\s+li[cç][aã]o\s+de|consoante\s+doutrina\s+de|como\s+adverte|doutrina\s+de|preleciona|adverte|ensina)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+){1,4})/g,
    tipo: "doutrina",
    fonte: (m) => `Doutrina: ${m[1].trim()}`,
    url: (m) => "https://www.google.com/search?q=" + encodeURIComponent("doutrina jurídica " + (m[1] || "")),
  },
  // LEIS FEDERAIS ORDINÁRIAS OU COMPLEMENTARES
  {
    pattern: /(?:Lei\s+(?:Federal\s+|Complementar\s+)?(?:n[oº°]?\.?\s*)?|LC\s+)(\d[\d.]+\/\d{2,4})\b/gi,
    tipo: "lei",
    fonte: (m) => m[0].trim(),
    url: (m) => "https://www.planalto.gov.br/ccivil_03/leis/" + m[1].replace(/\./g, "").replace(/\//g, "") + ".htm",
  },
];

function extrairDispositivos(html: string): Dispositivo[] {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const dispositivos: Dispositivo[] = [];
  const seen = new Set<string>();

  for (const rule of REGRAS) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const matchText = m[0].trim();
      const fonte = rule.fonte(m);
      const key = `${rule.tipo}:${fonte.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        dispositivos.push({
          id: `disp-${Math.random().toString(36).substring(2, 9)}`,
          tipo: rule.tipo,
          codigo: matchText,
          fonte,
          url: rule.url ? rule.url(m) : undefined,
        });
      }
    }
  }

  return dispositivos.slice(0, 30);
}

const BADGE: Record<TipoDispositivo, { label: string; icon: any }> = {
  artigo: { label: "Artigo", icon: BookOpen },
  sumula: { label: "Súmula", icon: Scale },
  tema: { label: "Tema", icon: FileCode2 },
  jurisprudencia: { label: "Jurisprudência", icon: Gavel },
  doutrina: { label: "Doutrina", icon: GraduationCap },
  lei: { label: "Lei", icon: BookOpen },
};

const GRUPOS_DISPOSITIVOS = [
  {
    key: "artigos",
    label: "Artigos de Lei & Códigos",
    icon: BookOpen,
    tipos: ["artigo", "lei"] as TipoDispositivo[],
  },
  {
    key: "sumulas_temas",
    label: "Súmulas & Temas Vinculantes",
    icon: Scale,
    tipos: ["sumula", "tema"] as TipoDispositivo[],
  },
  {
    key: "jurisprudencia",
    label: "Jurisprudência & Precedentes",
    icon: Gavel,
    tipos: ["jurisprudencia"] as TipoDispositivo[],
  },
  {
    key: "doutrina",
    label: "Doutrina Jurídica",
    icon: GraduationCap,
    tipos: ["doutrina"] as TipoDispositivo[],
  },
];

export function DispositivosMapeados({ editorHtml }: DispositivosMapeadosProps) {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [lastAuditTime, setLastAuditTime] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editorHtml) return;
    setProcessing(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const extracted = extrairDispositivos(editorHtml);
      setDispositivos((prev) => {
        const mapExisting = new Map(
          prev.map((d) => [(d.fonte || d.codigo || "").toLowerCase().trim(), d])
        );
        return extracted.map((item) => {
          const key = (item.fonte || item.codigo || "").toLowerCase().trim();
          const existing = mapExisting.get(key);
          if (existing?.status) {
            return {
              ...item,
              status: existing.status,
              veredito: existing.veredito,
              explicacao: existing.explicacao,
              sugestao: existing.sugestao,
            };
          }
          return item;
        });
      });
      setProcessing(false);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editorHtml]);

  const handleValidateCitations = async () => {
    if (!editorHtml || validating) return;
    setValidating(true);

    try {
      const res = await fetch("/api/gemini/validate-citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: editorHtml,
          items: dispositivos.map((d) => ({ codigo: d.codigo, fonte: d.fonte, tipo: d.tipo })),
        }),
      });

      if (!res.ok) {
        throw new Error("Falha na validação de citações.");
      }

      const data = await res.json();
      const results: any[] = data.results || [];

      if (results.length > 0) {
        setDispositivos((prev) => {
          const updated = [...prev];
          results.forEach((audit) => {
            if (!audit) return;
            const auditFonte = (audit.fonte || "").toLowerCase().trim();
            const auditCodigo = (audit.codigo || "").toLowerCase().trim();
            if (!auditFonte && !auditCodigo) return;

            const idx = updated.findIndex((d) => {
              if (!d) return false;
              const dFonte = (d.fonte || "").toLowerCase().trim();
              const dCodigo = (d.codigo || "").toLowerCase().trim();

              return (
                (dFonte && auditFonte && (dFonte.includes(auditFonte) || auditFonte.includes(dFonte))) ||
                (dCodigo && auditCodigo && (dCodigo.includes(auditCodigo) || auditCodigo.includes(dCodigo))) ||
                (dFonte && auditCodigo && (dFonte.includes(auditCodigo) || auditCodigo.includes(dFonte))) ||
                (dCodigo && auditFonte && (dCodigo.includes(auditFonte) || auditFonte.includes(dCodigo)))
              );
            });

            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                status: audit.status || "valid",
                veredito: audit.veredito,
                explicacao: audit.explicacao,
                sugestao: audit.sugestao,
              };
            }
          });
          return updated;
        });
      }

      setLastAuditTime(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      console.error("Erro na auditoria:", error);
    } finally {
      setValidating(false);
    }
  };

  const countValid = dispositivos.filter((d) => d.status === "valid").length;
  const countWarning = dispositivos.filter((d) => d.status === "warning").length;
  const countHallucination = dispositivos.filter((d) => d.status === "hallucination").length;

  if (isMinimized) {
    return (
      <div className="flex justify-end">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-full border border-border/80 bg-card/95 backdrop-blur shadow-md hover:bg-muted/80 transition-all cursor-pointer group animate-in fade-in slide-in-from-right-4"
          title="Expandir Dispositivos Mapeados"
        >
          <div className="size-6 rounded-full bg-muted flex items-center justify-center text-foreground group-hover:scale-105 transition-transform">
            <BookOpen className="size-3.5" />
          </div>
          <span className="text-xs font-semibold text-foreground">Dispositivos ({dispositivos.length})</span>
          {countHallucination > 0 ? (
            <span className="size-2 rounded-full bg-rose-500 animate-pulse" title="Alucinação detectada" />
          ) : countValid > 0 ? (
            <span className="size-2 rounded-full bg-emerald-500" title="Validado" />
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border/80 bg-card/95 backdrop-blur shadow-md overflow-hidden transition-all duration-300">
      {/* Header Minimalista */}
      <div className="w-full bg-muted/20 border-b border-border/60 px-3 py-2.5">
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
          >
            <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
              <BookOpen className="size-3.5 text-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground truncate">Dispositivos</span>
                {dispositivos.length > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-muted text-[9px] font-medium text-muted-foreground border border-border/60 shrink-0">
                    {dispositivos.length}
                  </span>
                )}
                {processing && <Loader2 className="size-3 text-muted-foreground animate-spin shrink-0" />}
              </div>
              <p className="text-[9px] text-muted-foreground truncate">Artigos, Súmulas & Precedentes</p>
            </div>
          </button>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Minimizar para botão flutuante"
            >
              <ChevronDown className="size-3.5 rotate-90" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={expanded ? "Recolher painel" : "Expandir painel"}
            >
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          </div>
        </div>

        {/* Botão de Double Check Anti-Alucinação */}
        {expanded && (
          <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center gap-2">
            <button
              onClick={handleValidateCitations}
              disabled={validating || dispositivos.length === 0}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all shadow-xs cursor-pointer border ${
                validating
                  ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
                  : "bg-foreground text-background hover:bg-foreground/90 border-foreground/20 active:scale-[0.98]"
              }`}
              title="Audita todas as citações normativas e precedentes com base na legislação oficial brasileira para evitar alucinações da IA"
            >
              {validating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Auditando Citações...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5" />
                  <span>Validar Artigos & Citações</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Resumo do Status Anti-Alucinação */}
        {expanded && lastAuditTime && (
          <div className="mt-2 flex items-center justify-between px-1.5 py-1 rounded-md bg-muted/40 border border-border/40 text-[10px]">
            <span className="text-muted-foreground">Auditado às {lastAuditTime}:</span>
            <div className="flex items-center gap-2 font-medium">
              {countValid > 0 && <span className="text-emerald-500 flex items-center gap-0.5"><CheckCircle2 className="size-2.5" /> {countValid}</span>}
              {countWarning > 0 && <span className="text-amber-500 flex items-center gap-0.5"><AlertTriangle className="size-2.5" /> {countWarning}</span>}
              {countHallucination > 0 && <span className="text-rose-500 flex items-center gap-0.5"><XCircle className="size-2.5" /> {countHallucination}</span>}
              {countHallucination === 0 && countWarning === 0 && (
                <span className="text-emerald-500 flex items-center gap-0.5">100% Válido</span>
              )}
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div className="p-2.5 space-y-2.5 max-h-[calc(100vh-230px)] min-h-[420px] overflow-y-auto custom-scrollbar-dark">
          {dispositivos.length === 0 && !processing ? (
            <div className="text-center py-10 px-3">
              <BookOpen className="size-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs font-medium text-foreground">Nenhum dispositivo identificado</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Os artigos, súmulas e precedentes citados no documento aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            GRUPOS_DISPOSITIVOS.map((grupo) => {
              const itensNoGrupo = dispositivos.filter((d) => grupo.tipos.includes(d.tipo));
              if (itensNoGrupo.length === 0) return null;

              const GrupoIcon = grupo.icon;

              return (
                <div key={grupo.key} className="space-y-1">
                  {/* Cabeçalho da Categoria */}
                  <div className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/40 border border-border/40 text-[11px] font-semibold text-foreground">
                    <div className="flex items-center gap-1.5">
                      <GrupoIcon className="size-3 text-muted-foreground" />
                      <span>{grupo.label}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full border border-border/60 bg-muted text-muted-foreground font-medium">
                      {itensNoGrupo.length}
                    </span>
                  </div>

                  {/* Cards dos Dispositivos */}
                  <div className="space-y-1">
                    {itensNoGrupo.map((d) => {
                      const badgeConfig = BADGE[d.tipo] || BADGE.artigo;
                      const IconComponent = badgeConfig.icon;
                      const isExpanded = expandedItemId === d.id;

                      return (
                        <div
                          key={d.id}
                          className={`rounded-lg border transition-all duration-200 overflow-hidden ${
                            d.status === "hallucination"
                              ? "border-rose-500/40 bg-rose-500/5 dark:bg-rose-950/20"
                              : d.status === "warning"
                              ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20"
                              : d.status === "valid"
                              ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/10"
                              : "border-border/50 bg-background/50 hover:bg-muted/30"
                          }`}
                        >
                          <div
                            onClick={() => setExpandedItemId(isExpanded ? null : d.id)}
                            className="p-2 flex items-start gap-2 cursor-pointer"
                          >
                            <span className="shrink-0 mt-0.5 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground flex items-center gap-1">
                              <IconComponent className="size-2.5" />
                              <span>{badgeConfig.label}</span>
                            </span>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-[11px] font-medium text-foreground truncate">{d.fonte}</p>
                                {/* Selos discretos */}
                                {d.status === "valid" && (
                                  <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                    <CheckCircle2 className="size-2.5" /> Válido
                                  </span>
                                )}
                                {d.status === "warning" && (
                                  <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                    <AlertTriangle className="size-2.5" /> Atenção
                                  </span>
                                )}
                                {d.status === "hallucination" && (
                                  <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                    <XCircle className="size-2.5" /> Alucinação
                                  </span>
                                )}
                              </div>

                              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{d.codigo}</p>
                            </div>

                            {d.url && (
                              <a
                                href={d.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Abrir link oficial"
                                className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>

                          {/* Detalhes da Auditoria Expansível */}
                          {isExpanded && (
                            <div className="px-2 pb-2 pt-1 border-t border-border/40 text-[10px] space-y-1.5 bg-muted/20">
                              {d.veredito && (
                                <div className="flex items-start gap-1 text-foreground font-medium">
                                  <Info className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                                  <span>{d.veredito}</span>
                                </div>
                              )}

                              {d.explicacao && (
                                <p className="text-muted-foreground leading-relaxed pl-2.5 border-l border-border">
                                  {d.explicacao}
                                </p>
                              )}

                              {d.sugestao && (
                                <div className="p-1.5 rounded bg-muted/50 border border-border/60 text-foreground">
                                  <span className="font-semibold">Sugestão: </span>
                                  <span className="text-muted-foreground">{d.sugestao}</span>
                                </div>
                              )}

                              {!d.status && (
                                <p className="text-muted-foreground italic text-center py-0.5 text-[9px]">
                                  Clique em &quot;Validar Artigos & Citações&quot; para auditar este item.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}