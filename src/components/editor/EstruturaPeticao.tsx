"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  ListTree,
  ChevronDown,
  ChevronUp,
  FileText,
  Scale,
  ShieldAlert,
  CheckSquare,
  Users,
  DollarSign,
  ChevronRight,
  Gavel,
} from "lucide-react";

export interface TopicoItem {
  id: string;
  level: number; // 1 = Principal, 2 = Subtópico
  titulo: string;
  tipo: "acao" | "partes" | "fatos" | "direito" | "liminar" | "pedidos" | "valor" | "geral";
}

interface EstruturaPeticaoProps {
  editorHtml: string;
}

const ICONS_TIPO: Record<TopicoItem["tipo"], any> = {
  acao: Gavel,
  partes: Users,
  fatos: FileText,
  direito: Scale,
  liminar: ShieldAlert,
  pedidos: CheckSquare,
  valor: DollarSign,
  geral: FileText,
};

// Padronização rigorosa de títulos forenses em Title Case com numerais romanos e preposições minúsculas
function formatarTituloPadrao(texto: string, tipo: TopicoItem["tipo"]): string {
  if (!texto) return "";
  const clean = texto.replace(/^#+\s*/, "").replace(/[:\-–]+$/, "").trim();

  // 1. Nome da Ação: Caixa Alta Total
  if (tipo === "acao") {
    return clean.toUpperCase();
  }

  // 2. Partes
  if (tipo === "partes") {
    return clean;
  }

  // 3. Seções Principais
  if (tipo === "fatos" || /^(?:I|1)[\.\s\–\-]*(?:DOS\s+FATOS|DO\s+HISTÓRICO)/i.test(clean)) {
    return "I. Dos Fatos";
  }

  if (tipo === "direito" && /^(?:II|2)[\.\s\–\-]*(?:DO\s+DIREITO|DA\s+FUNDAMENTAÇÃO)/i.test(clean)) {
    return "II. Do Direito";
  }

  if (tipo === "liminar" || /(?:DA\s+TUTELA|DA\s+LIMINAR|DO\s+PEDIDO\s+LIMINAR)/i.test(clean)) {
    return "Da Tutela de Urgência";
  }

  if (tipo === "pedidos" || /^(?:III|IV|V|VI|\d+)?[\.\s\–\-]*(?:DOS\s+PEDIDOS|DOS\s+REQUERIMENTOS|DO\s+PEDIDO)/i.test(clean)) {
    return "III. Dos Pedidos";
  }

  if (tipo === "valor" || /^(?:DO\s+VALOR\s+DA\s+CAUSA|Dá-se à causa)/i.test(clean)) {
    const matchValor = clean.match(/(R\$\s*[\d\.,]+)/i);
    return matchValor ? `Do Valor da Causa: ${matchValor[1]}` : "Do Valor da Causa";
  }

  // 4. Subtópicos em Title Case elegante (ex: "1. Da Relação de Consumo")
  const preposicoes = new Set(["de", "da", "do", "das", "dos", "e", "em", "por", "para", "com", "a", "o", "as", "os", "na", "no", "nas", "nos", "ao", "aos", "à", "às"]);
  
  const prefixMatch = clean.match(/^([IVXLCDM\d]+[\.\-–\s]+)(.*)$/i);
  let prefix = "";
  let body = clean;
  if (prefixMatch) {
    prefix = prefixMatch[1];
    body = prefixMatch[2];
  }

  const words = body.toLowerCase().split(/\s+/);
  const formattedBody = words
    .map((word, i) => {
      if (!word) return "";
      if (i > 0 && preposicoes.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");

  return `${prefix}${formattedBody}`.trim();
}

export function EstruturaPeticao({ editorHtml }: EstruturaPeticaoProps) {
  const [topicos, setTopicos] = useState<TopicoItem[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editorHtml) {
      setTopicos([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (typeof window === "undefined") return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(editorHtml, "text/html");
      const items: TopicoItem[] = [];

      // 1. Extração Dinâmica do Preâmbulo (Ação, Autor, Réu)
      let tipoAcaoText = "";
      let autorText = "";
      let reuText = "";
      let acaoId = "node-tipo-acao";
      let autorId = "node-autor";
      let reuId = "node-reu";

      const h2Elements = Array.from(doc.querySelectorAll("h2, h1"));
      for (const h of h2Elements) {
        const txt = h.textContent?.trim() || "";
        if (
          txt.toUpperCase().includes("AÇÃO") ||
          txt.toUpperCase().includes("MANDADO") ||
          txt.toUpperCase().includes("HABEAS") ||
          txt.toUpperCase().includes("EMBARGOS") ||
          txt.toUpperCase().includes("EXECUÇÃO") ||
          txt.toUpperCase().includes("RECLAMAÇÃO") ||
          txt.toUpperCase().includes("RECURSO")
        ) {
          tipoAcaoText = txt;
          acaoId = h.getAttribute("id") || acaoId;
          break;
        }
      }

      const paragraphs = Array.from(doc.querySelectorAll("p"));
      for (const p of paragraphs.slice(0, 10)) {
        const strong = p.querySelector("strong, b");
        const strongText = strong?.textContent?.trim() || "";
        const fullText = p.textContent?.trim() || "";

        if (!autorText && (fullText.includes("propor a presente") || fullText.includes("vem respeitosamente") || fullText.includes("vem, perante") || fullText.includes("vem propor"))) {
          autorText = strongText || fullText.split(",")[0] || "";
          autorId = p.getAttribute("id") || autorId;
        }

        if (!reuText && (fullText.includes("em face de") || fullText.includes("em face da") || fullText.includes("contra") || fullText.includes("em desfavor de"))) {
          reuText = strongText || fullText.replace(/^.*(?:em face de|contra|em desfavor de)\s+/i, "").split(",")[0] || "";
          reuId = p.getAttribute("id") || reuId;
        }
      }

      // 1º Nome da Ação (em CAIXA ALTA padronizada)
      if (tipoAcaoText) {
        items.push({
          id: acaoId,
          level: 1,
          titulo: formatarTituloPadrao(tipoAcaoText, "acao"),
          tipo: "acao",
        });
      }

      // 2º Autor
      if (autorText) {
        items.push({
          id: autorId,
          level: 2,
          titulo: `Autora: ${autorText}`,
          tipo: "partes",
        });
      }

      // 3º Réu
      if (reuText) {
        items.push({
          id: reuId,
          level: 2,
          titulo: `Réu: ${reuText}`,
          tipo: "partes",
        });
      }

      // 2. Extração Dinâmica de Seções (Fatos, Direito, Subtópicos, Liminar, Pedidos, Valor)
      const itemsFatos: TopicoItem[] = [];
      const itemsDireito: TopicoItem[] = [];
      const itemsLiminar: TopicoItem[] = [];
      let itemPedidos: TopicoItem | null = null;
      let itemValor: TopicoItem | null = null;

      const allElements = Array.from(doc.querySelectorAll("h1, h2, h3, h4, p, strong"));

      allElements.forEach((el, idx) => {
        const tagName = el.tagName.toLowerCase();
        const text = el.textContent?.trim() || "";
        const id = el.getAttribute("id") || `elem-${idx}`;

        // Se for Pedidos
        if (
          (tagName === "h2" || tagName === "h3" || tagName === "strong") &&
          /^(?:III|IV|V|VI|\d+)?[\.\s\–\-]*(?:DOS\s+PEDIDOS|DOS\s+REQUERIMENTOS|DO\s+PEDIDO)/i.test(text)
        ) {
          if (!itemPedidos) {
            itemPedidos = {
              id,
              level: 1,
              titulo: formatarTituloPadrao(text, "pedidos"),
              tipo: "pedidos",
            };
          }
          return;
        }

        // Tópicos principais e subtópicos
        if (tagName === "h2" || tagName === "h3" || (tagName === "p" && el.querySelector("strong") && text.length < 90)) {
          if (text === tipoAcaoText || text.toUpperCase().includes("EXCELENTÍSSIMO")) return;

          // Fatos
          if (/^(?:I|1)[\.\s\–\-]*(?:DOS\s+FATOS|DO\s+HISTÓRICO)/i.test(text)) {
            itemsFatos.push({
              id,
              level: 1,
              titulo: formatarTituloPadrao(text, "fatos"),
              tipo: "fatos",
            });
            return;
          }

          // Tutela de Urgência / Liminar
          if (/(?:DA\s+TUTELA|DA\s+LIMINAR|DO\s+PEDIDO\s+LIMINAR|DA\s+MEDIDA\s+LIMINAR)/i.test(text)) {
            itemsLiminar.push({
              id,
              level: 1,
              titulo: formatarTituloPadrao(text, "liminar"),
              tipo: "liminar",
            });
            return;
          }

          // Direito (Título Principal)
          if (/^(?:II|2)[\.\s\–\-]*(?:DO\s+DIREITO|DA\s+FUNDAMENTAÇÃO)/i.test(text)) {
            itemsDireito.push({
              id,
              level: 1,
              titulo: formatarTituloPadrao(text, "direito"),
              tipo: "direito",
            });
            return;
          }

          // Subtópicos do Direito (ex: "1. Da Relação de Consumo")
          if (/^\d+[\.\s\–\-]+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/i.test(text) || tagName === "h3") {
            itemsDireito.push({
              id,
              level: 2,
              titulo: formatarTituloPadrao(text, "direito"),
              tipo: "direito",
            });
            return;
          }

          // Ignora Provas
          if (/(?:DAS\s+PROVAS|DO\s+PROTESTO\s+POR\s+PROVAS)/i.test(text) || text.startsWith("Protesta provar")) {
            return;
          }

          // Valor da Causa
          if (/^(?:DO\s+VALOR\s+DA\s+CAUSA|Dá-se à causa)/i.test(text)) {
            itemValor = {
              id,
              level: 1,
              titulo: formatarTituloPadrao(text, "valor"),
              tipo: "valor",
            };
            return;
          }
        }
      });

      // Montagem da Árvore Padronizada
      items.push(...itemsFatos);
      items.push(...itemsDireito);
      items.push(...itemsLiminar);

      if (itemPedidos) {
        items.push(itemPedidos);
      }

      if (itemValor) {
        items.push(itemValor);
      }

      setTopicos(items);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [editorHtml]);

  const handleScrollToTopic = (id: string, titulo: string) => {
    setActiveTopicId(id);

    let targetEl = document.getElementById(id);

    if (!targetEl) {
      const editorEl = document.querySelector(".simple-editor");
      if (editorEl) {
        const cleanQuery = titulo.replace(/^(?:Autora|Réu|Do Valor da Causa):\s*/i, "").toLowerCase();
        const allHeadings = Array.from(editorEl.querySelectorAll("h1, h2, h3, h4, strong, b, p"));
        for (const el of allHeadings) {
          const elText = el.textContent?.trim().toLowerCase() || "";
          if (elText.includes(cleanQuery) || cleanQuery.includes(elText)) {
            targetEl = el as HTMLElement;
            break;
          }
        }
      }
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });

      targetEl.style.transition = "background-color 0.4s ease, outline 0.4s ease";
      targetEl.style.outline = "2px solid var(--primary)";
      targetEl.style.outlineOffset = "4px";
      targetEl.style.borderRadius = "4px";

      setTimeout(() => {
        if (targetEl) {
          targetEl.style.outline = "none";
        }
      }, 1800);
    }
  };

  if (isMinimized) {
    return (
      <div className="flex justify-start">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3 py-2 rounded-full border border-border/80 bg-card/95 backdrop-blur shadow-md hover:bg-muted/80 transition-all cursor-pointer group animate-in fade-in slide-in-from-left-4"
          title="Expandir Estrutura da Petição"
        >
          <div className="size-6 rounded-full bg-muted flex items-center justify-center text-foreground group-hover:scale-105 transition-transform">
            <ListTree className="size-3.5" />
          </div>
          <span className="text-xs font-semibold text-foreground">Estrutura ({topicos.length})</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-border/80 bg-card/95 backdrop-blur shadow-md overflow-hidden transition-all duration-300">
      {/* Header Clean */}
      <div className="w-full bg-muted/20 border-b border-border/60 px-3 py-2.5">
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-left cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
          >
            <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
              <ListTree className="size-3.5 text-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground truncate">Estrutura da Peça</span>
                {topicos.length > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-muted text-[9px] font-medium text-muted-foreground border border-border/60 shrink-0">
                    {topicos.length}
                  </span>
                )}
              </div>
              <p className="text-[9px] text-muted-foreground truncate">Navegação por Tópicos</p>
            </div>
          </button>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Minimizar para botão flutuante"
            >
              <ChevronDown className="size-3.5 -rotate-90" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title={expanded ? "Recolher" : "Expandir"}
            >
              {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-2.5 space-y-1 max-h-[calc(100vh-230px)] min-h-[420px] overflow-y-auto custom-scrollbar-dark">
          {topicos.length === 0 ? (
            <div className="text-center py-10 px-3">
              <ListTree className="size-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs font-medium text-foreground">Estruturando petição...</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Os tópicos da petição aparecerão aqui conforme o documento é preenchido.
              </p>
            </div>
          ) : (
            topicos.map((topico, idx) => {
              const IconComponent = ICONS_TIPO[topico.tipo] || FileText;
              const isActive = activeTopicId === topico.id;

              return (
                <button
                  key={topico.id || idx}
                  onClick={() => handleScrollToTopic(topico.id, topico.titulo)}
                  style={{
                    paddingLeft: `${Math.max(6, (topico.level - 1) * 8 + 6)}px`,
                  }}
                  className={`w-full flex items-center gap-2 py-1.5 pr-2 rounded-lg text-left transition-all cursor-pointer group ${
                    isActive
                      ? "bg-muted text-foreground font-bold border border-border"
                      : topico.tipo === "acao"
                      ? "bg-muted/40 hover:bg-muted/70 text-foreground border border-border/60 font-semibold"
                      : "hover:bg-muted/40 text-foreground/80 hover:text-foreground"
                  }`}
                  title={`Navegar para: ${topico.titulo}`}
                >
                  <div className="size-5 rounded-md border border-border/50 bg-muted/40 flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                    <IconComponent className="size-2.5" />
                  </div>

                  <span
                    className={`text-[11px] truncate flex-1 leading-tight ${
                      topico.tipo === "acao"
                        ? "font-bold tracking-wide uppercase text-foreground text-[11px]"
                        : topico.level === 1
                        ? "font-semibold text-foreground"
                        : "font-normal text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {topico.titulo}
                  </span>

                  <ChevronRight className="size-3 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
