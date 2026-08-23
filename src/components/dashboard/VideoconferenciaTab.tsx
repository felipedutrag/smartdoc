"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Video, AlertCircle, Link as LinkIcon, ExternalLink, Loader2, Play } from "lucide-react";
import { useGeminiLive } from "@/hooks/use-gemini-live";
import { Button } from "@/components/ui/button";

export function VideoconferenciaTab() {
  const [meetUrl, setMeetUrl] = useState("");
  const [isLive, setIsLive] = useState(false);
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
      setIsLive(false);
    } else {
      connect();
      setIsLive(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Videoconferência com IA
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Associe um link do Google Meet e deixe a IA ouvir a reunião em modo passivo. Ela transcreverá insights e sugerirá artigos jurídicos em tempo real na sua tela.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
        {/* Left: Google Meet Config & Frame */}
        <div className="flex flex-col rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden h-full">
          <div className="p-4 border-b border-border/60 bg-muted/20">
            <label className="text-xs font-semibold text-foreground mb-1 block">Link da Reunião (Google Meet)</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                  className="w-full rounded-lg border border-border/80 bg-background pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 shrink-0 h-10"
                onClick={() => {
                  if (meetUrl) window.open(meetUrl, "_blank");
                }}
                disabled={!meetUrl}
              >
                <ExternalLink className="size-4" />
                <span>Abrir Meet</span>
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Nota: O Google Meet pode bloquear a exibição dentro da página. Se a tela abaixo ficar cinza ou recusar a conexão, clique em "Abrir Meet" para abrir a reunião em outra aba e mantenha esta página aberta ouvindo o microfone.
            </p>
          </div>
          
          <div className="flex-1 bg-black/5 relative flex items-center justify-center overflow-hidden">
            {meetUrl ? (
              <iframe
                src={meetUrl}
                allow="camera; microphone; fullscreen; display-capture"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-6 text-center">
                <Video className="size-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Insira o link acima para carregar</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: AI Assistant Passive Mode */}
        <div className="flex flex-col rounded-xl border border-border/80 bg-card shadow-sm overflow-hidden h-full">
          <div className="flex items-center justify-between p-4 border-b border-border/60 bg-muted/20">
            <div>
              <h3 className="text-sm font-bold text-foreground">Transcrições e Insights</h3>
              <p className="text-xs text-muted-foreground mt-0.5">A IA analisa o áudio e sugere teses em tempo real</p>
            </div>
            
            <Button
              onClick={toggleAssistant}
              disabled={isConnecting}
              className={`gap-2 h-9 px-4 text-xs font-semibold shadow-sm transition-all ${
                isConnected
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Conectando...
                </>
              ) : isConnected ? (
                <>
                  <Mic className="size-3.5 animate-pulse" />
                  Parar Escuta
                </>
              ) : (
                <>
                  <Play className="size-3.5" />
                  Iniciar Assistente
                </>
              )}
            </Button>
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
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground/60">
                <Mic className="size-10 mb-3 opacity-20" />
                <p className="text-sm font-medium text-center px-6">
                  O assistente está inativo.<br/>Clique em "Iniciar Assistente" para começar a ouvir a reunião.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
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
