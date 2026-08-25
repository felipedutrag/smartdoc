"use client";

import React, { useState, useEffect } from "react";
import { Scale, Sparkles } from "lucide-react";

interface LoadingOverlayProps {
  isGenerating: boolean;
}

const GENERATION_STEPS = [
  "Analisando os fatos narrados...",
  "Identificando artigos de lei e dispositivos aplicáveis...",
  "Estruturando fundamentação jurídica e jurisprudência...",
  "Redigindo endereçamento, partes e pedidos detalhados...",
  "Aplicando diagramação nos padrões forenses..."
];

export function LoadingOverlay({ isGenerating }: LoadingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < GENERATION_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, [isGenerating]);

  if (!isGenerating) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-background/90 backdrop-blur-2xl gap-6 p-6 sm:p-10 text-foreground transition-all duration-300 animate-in fade-in">
      <div className="relative flex flex-col items-center justify-center gap-5">
        {/* Brand Logo matching Home Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 text-primary shadow-lg shadow-primary/10 animate-pulse">
            <Scale className="size-5.5" />
          </div>
          <div className="flex items-center text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            <span>SMART</span>
            <span className="text-primary font-black ml-1">DOC</span>
            <span className="ml-2.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-primary uppercase tracking-widest">
              PRO
            </span>
          </div>
        </div>

        {/* Progress Bar with theme colors */}
        <div className="w-64 sm:w-80 h-1.5 bg-muted/60 rounded-full overflow-hidden relative shadow-inner border border-border/40">
          <div
            className="absolute top-0 left-0 h-full w-2/5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-[progressIndeterminate_1.4s_ease-in-out_infinite]"
          />
        </div>

        <style>{`
          @keyframes progressIndeterminate {
            0% { transform: translateX(-150%); }
            100% { transform: translateX(250%); }
          }
        `}</style>
      </div>

      <div className="text-center max-w-md space-y-2">
        <h3 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <span>Inteligência Forense em Execução</span>
        </h3>
        <p className="text-xs sm:text-sm text-primary font-medium transition-all duration-300 min-h-[20px]">
          {GENERATION_STEPS[stepIndex]}
        </p>
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed font-mono pt-1">
          A petição será digitada e formatada na sua tela em instantes.
        </p>
      </div>
    </div>
  );
}
