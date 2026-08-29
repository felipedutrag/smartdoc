"use client";

import React, { useEffect, useState, useRef } from "react";
import { BookOpen, ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";

interface Dispositivo {
  tipo: "artigo" | "sumula" | "lei";
  codigo: string;
  descricao: string;
  fonte: string;
  url?: string;
}

interface DispositivosMapeadosProps {
  editorHtml: string;
}

interface RegraDispositivo {
  pattern: RegExp;
  tipo: Dispositivo["tipo"];
  fonte: (m: RegExpMatchArray) => string;
  url?: (m: RegExpMatchArray) => string;
}

const DISPOSITIVO_REGEXES: RegraDispositivo[] = [
  {
    pattern: /Art(?:igo|\.)\s*\d+[°º]?(?:,?\s*§\s*\d+[°º]?)?(?:,?\s*inc(?:iso)?\.?\s*[IVXLC]+)?\s+d[ao]s?\s+(?:Código\s+)?(?:Civil|CC)\b/gi,
    tipo: "artigo",
    fonte: () => "Código Civil",
    url: () => "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
  },
  {
    pattern: /Art(?:igo|\.)\s*\d+[°º]?(?:,?\s*§\s*\d+[°º]?)?(?:,?\s*inc(?:iso)?\.?\s*[IVXLC]+)?\s+d[ao]s?\s+(?:Código\s+de\s+Defesa\s+do\s+Consumidor|CDC)\b/gi,
    tipo: "artigo",
    fonte: () => "Código de Defesa do Consumidor",
    url: () => "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
  },
  {
    pattern: /Art(?:igo|\.)\s*\d+[°º]?(?:,?\s*§\s*\d+[°º]?)?(?:,?\s*inc(?:iso)?\.?\s*[IVXLC]+)?\s+d[ao]s?\s+(?:Código\s+de\s+Processo\s+Civil|CPC)\b/gi,
    tipo: "artigo",
    fonte: () => "Código de Processo Civil",
    url: () => "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105compilado.htm",
  },
  {
    pattern: /Art(?:igo|\.)\s*\d+[°º]?(?:,?\s*§\s*\d+[°º]?)?(?:,?\s*inc(?:iso)?\.?\s*[IVXLC]+)?\s+d[ao]s?\s+(?:Constituição|CF|CRFB)\b/gi,
    tipo: "artigo",
    fonte: () => "Constituição Federal",
    url: () => "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
  },
  {
    pattern: /Art(?:igo|\.)\s*\d+[°º]?(?:,?\s*§\s*\d+[°º]?)?(?:,?\s*inc(?:iso)?\.?\s*[IVXLC]+)?\s+d[ao]s?\s+(?:Código\s+Penal|CP)\b/gi,
    tipo: "artigo",
    fonte: () => "Código Penal",
    url: () => "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
  },
  {
    pattern: /Art(?:igo|\.)\s*\d+[°º]?(?:,?\s*§\s*\d+[°º]?)?(?:,?\s*inc(?:iso)?\.?\s*[IVXLC]+)?\s+d[ao]s?\s+(?:Código\s+de\s+Trânsito|CTB)\b/gi,
    tipo: "artigo",
    fonte: () => "Código de Trânsito Brasileiro",
    url: () => "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
  },
  {
    pattern: /Súmula\s+(?:Vinculante\s+)?(?:n[°o]?\.?\s*)?(\d+)\s+(?:d[ao]\s+)?STJ\b/gi,
    tipo: "sumula",
    fonte: (m) => `Súmula ${m[1]} do STJ`,
    url: () => "https://www.stj.jus.br/sites/portalp/Paginas/Comunicacao/Noticias/sumulas.aspx",
  },
  {
    pattern: /Súmula\s+(?:Vinculante\s+)?(?:n[°o]?\.?\s*)?(\d+)\s+(?:d[ao]\s+)?STF\b/gi,
    tipo: "sumula",
    fonte: (m) => `Súmula ${m[1]} do STF`,
    url: () => "https://portal.stf.jus.br/jurisprudencia/sumariosumulas.asp",
  },
  {
    pattern: /Lei\s+(?:Federal\s+)?(?:n[°o]?\.?\s*)?(\d[\d.]+\/\d{4})\b/gi,
    tipo: "lei",
    fonte: (m) => `Lei ${m[1]}`,
    url: (m) => `https://www.planalto.gov.br/ccivil_03/leis/${m[1].replace(/\./g, "")}.htm`,
  },
];

function extrairDispositivos(html: string): Dispositivo[] {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  const dispositivos: Dispositivo[] = [];
  const seenCodes = new Set<string>();

  for (const rule of DISPOSITIVO_REGEXES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0].trim();
      const numero = match[1] || "";
      const fonte = rule.fonte(match);
      const key = `${fonte}:${matchText}`;

      if (!seenCodes.has(key)) {
        seenCodes.add(key);
        dispositivos.push({
          tipo: rule.tipo,
          codigo: matchText,
          descricao: numero,
          fonte,
          url: rule.url ? rule.url(match) : undefined,
        });
      }
    }
  }

  return dispositivos.slice(0, 20);
}

const BADGE_COLORS: Record<Dispositivo["tipo"], string> = {
  artigo: "bg-primary/10 text-primary border-primary/20",
  sumula: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  lei: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
};

const BADGE_LABEL: Record<Dispositivo["tipo"], string> = {
  artigo: "Art.",
  sumula: "Súm.",
  lei: "Lei",
};

export function DispositivosMapeados({ editorHtml }: DispositivosMapeadosProps) {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [processing, setProcessing] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!editorHtml) return;
    setProcessing(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const found = extrairDispositivos(editorHtml);
      setDispositivos(found);
      setProcessing(false);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editorHtml]);

  return (
    <div className="w-full rounded-xl border border-border/70 bg-card/80 backdrop-blur shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="size-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">Dispositivos Mapeados</span>
          {dispositivos.length > 0 && (
            <span className="inline-flex items-center justify-center size-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {dispositivos.length}
            </span>
          )}
          {processing && <Loader2 className="size-3 text-muted-foreground animate-spin" />}
        </div>
        {expanded
          ? <ChevronUp className="size-3.5 text-muted-foreground" />
          : <ChevronDown className="size-3.5 text-muted-foreground" />
        }
      </button>

      {/* List */}
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 max-h-[320px] overflow-y-auto custom-scrollbar-dark">
          {dispositivos.length === 0 && !processing ? (
            <p className="text-[11px] text-muted-foreground text-center py-4 italic">
              Nenhum dispositivo identificado ainda.
            </p>
          ) : (
            dispositivos.map((d, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/50 px-2.5 py-2 hover:bg-muted/30 transition-colors group"
              >
                <span className={`shrink-0 mt-0.5 rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${BADGE_COLORS[d.tipo]}`}>
                  {BADGE_LABEL[d.tipo]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground leading-tight">{d.fonte}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{d.codigo}</p>
                </div>
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Ver texto da lei"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
