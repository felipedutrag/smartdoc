"use client";

import React from "react";
import { Scale } from "lucide-react";

interface LoadingOverlayProps {
  mounted: boolean;
  isGenerating: boolean;
  streamStarted: boolean;
}

export function LoadingOverlay({
  mounted,
  isGenerating,
  streamStarted,
}: LoadingOverlayProps) {
  if (mounted && (!isGenerating || streamStarted)) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl gap-6 p-6 sm:p-10 text-foreground transition-all duration-300">
      <div className="relative flex flex-col items-center justify-center gap-5">
        {/* Brand Logo matching Home Header */}
        <div className="flex items-center gap-3 animate-pulse">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
            <Scale className="size-5" />
          </div>
          <div className="flex items-center text-2xl font-bold tracking-tight text-foreground">
            <span>SMART</span>
            <span className="text-primary font-black ml-1">DOC</span>
            <span className="ml-2.5 rounded border border-border/80 bg-muted/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              2.0
            </span>
          </div>
        </div>

        {/* Progress Bar with theme colors */}
        <div className="w-56 sm:w-64 h-1.5 bg-muted rounded-full overflow-hidden relative shadow-inner">
          <div
            className="absolute top-0 left-0 h-full w-2/5 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full animate-[progressIndeterminate_1.5s_ease-in-out_infinite]"
          />
        </div>

        <style>{`
          @keyframes progressIndeterminate {
            0% { transform: translateX(-150%); }
            100% { transform: translateX(250%); }
          }
        `}</style>
      </div>

      <div className="text-center max-w-md space-y-1.5">
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Sua IA está redigindo a petição...
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-normal">
          Fundamentação jurídica, artigos de lei e jurisprudência sendo estruturados com precisão.
        </p>
      </div>
    </div>
  );
}
