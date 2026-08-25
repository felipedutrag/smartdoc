"use client";

import React, { useEffect, useRef } from "react";
import { Mic, AlertCircle, Loader2, Play, Sparkles, Scale, Radio } from "lucide-react";
import { useGeminiLive } from "@/hooks/use-gemini-live";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function VideoconferenciaTab() {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isConnected,
    isConnecting,
    error,
    micError,
    connect,
    stopLiveDialog
  } = useGeminiLive(
    undefined,
    "/api/config/gemini-meeting-setup",
    undefined,
    undefined,
    "meeting_session",
    ["TEXT"]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleAssistant = () => {
    if (isConnected) {
      stopLiveDialog();
    } else {
      connect();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Videoconferência com IA
            </h2>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 gap-1">
              <Radio className="size-3 animate-pulse" />
              Modo Passivo
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Deixe a IA ouvir sua reunião ou audiência em tempo real. Ela transcreverá pontos centrais e sugerirá artigos jurídicos e teses instantaneamente na sua tela.
          </p>
        </div>

        <Button
          onClick={toggleAssistant}
          disabled={isConnecting}
          className={`gap-2 h-10 px-5 text-xs font-semibold shadow-sm shrink-0 transition-all ${
            isConnected
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:opacity-90"
          }`}
        >
          {isConnecting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Conectando...
            </>
          ) : isConnected ? (
            <>
              <Mic className="size-4 animate-pulse" />
              Parar Escuta
            </>
          ) : (
            <>
              <Play className="size-4" />
              Iniciar Escuta em Tempo Real
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Left Side: Guia & Status */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <Scale className="size-4 text-primary" />
              <span>Como funciona a assessoria</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">•</span>
                <span>Inicie a escuta antes ou durante a sua reunião com o cliente ou audiência.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">•</span>
                <span>A IA permanece em silêncio e analisa a conversa apenas via texto para você.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">•</span>
                <span>Artigos do CPC/CC/CDC e teses pacificadas do STJ/STF aparecerão no painel ao lado.</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/20 p-5 shadow-sm space-y-2 text-xs">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <div className={`size-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-ping" : "bg-muted-foreground/40"}`} />
              <span>Status: {isConnected ? "Ouvindo microfone..." : "Aguardando início"}</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Dica: Você pode manter esta aba aberta no navegador enquanto conversa em qualquer plataforma (Meet, Teams, Zoom ou presencialmente).
            </p>
          </div>
        </div>

        {/* Right Side: Real-time Live Stream of Insights */}
        <div className="lg:col-span-2 flex flex-col rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden h-full">
          <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Transcrições e Insights Jurídicos</h3>
            </div>
            {isConnected && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Ao vivo
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 flex items-start gap-2.5 text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">{error}</div>
              </div>
            )}
            {micError && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 flex items-start gap-2.5 text-amber-600">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">{micError}</div>
              </div>
            )}

            {!isConnected && messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground/60 p-6 text-center">
                <Mic className="size-10 mb-3 opacity-25" />
                <p className="text-sm font-medium text-foreground/80">
                  Assistente em modo de espera
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Clique em "Iniciar Escuta em Tempo Real" acima para a IA começar a transcrever e gerar insights jurídicos.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card border border-border/80 text-foreground rounded-bl-none prose prose-sm dark:prose-invert"
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, "<br/>") }}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
