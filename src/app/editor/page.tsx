"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { useDashboardVoice } from "@/hooks/use-dashboard-voice";
import { FileDown, ArrowLeft, Mic, MicOff, Sparkles, Radio, Loader2, FastForward } from "lucide-react";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { SimpleEditorRef } from "@/components/tiptap-templates/simple/simple-editor";
import Link from "next/link";

import { LoadingOverlay } from "@/components/editor/LoadingOverlay";
import { FloatingAiBar } from "@/components/editor/FloatingAiBar";
import { renderPeticaoJsonToHtml, getPeticaoBlocks, PeticaoDocumentJson } from "@/lib/peticao-template";

export default function EditorPage() {
  const isMobileRaw = useIsBreakpoint("max", 860);
  const isMobile = isMobileRaw ?? false;
  const editorRef = React.useRef<SimpleEditorRef>(null);
  const [mounted, setMounted] = useState(false);

  // Inicializa isGenerating como true caso a URL possua ?generate=true para evitar flash de tela vazia
  const [isGenerating, setIsGenerating] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("generate") === "true";
    }
    return false;
  });

  const [isTypewriting, setIsTypewriting] = useState(false);
  const skipTypewritingRef = useRef(false);

  const [isRewriting, setIsRewriting] = useState(false);
  const [hasActiveEdit, setHasActiveEdit] = useState(false);

  const [textInput, setTextInput] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const [editQueue, setEditQueue] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função centralizada e segura para persistir no Supabase
  const saveToDatabase = useCallback(async (html: string) => {
    if (!html || html.trim() === "<p></p>") return;

    let docId = currentDocId;

    // Se ainda não tem docId, tenta buscar do localStorage/URL ou cria no banco
    if (!docId && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      docId = params.get("id");
    }

    setSaveStatus("saving");

    try {
      if (docId) {
        await fetch(`/api/documents/${docId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content_html: html,
            status: "draft",
          }),
        });
        setSaveStatus("saved");
      } else {
        // Cria documento se não existia
        const facts = (typeof window !== "undefined" ? localStorage.getItem("extrajus_facts") : "") || "Petição Inicial";
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: facts.slice(0, 70).replace(/\n/g, " ") + "...",
            facts,
            status: "draft",
            content_html: html,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.document?.id) {
            setCurrentDocId(data.document.id);
          }
        }
        setSaveStatus("saved");
      }
    } catch (err) {
      console.error("Falha ao salvar petição no banco:", err);
      setSaveStatus("unsaved");
    }
  }, [currentDocId]);

  // Handler de mudanças no editor (humana com debounce de 5s, IA instantâneo)
  const lastHtmlRef = useRef<string>("");

  const handleContentChange = useCallback((html: string, source: "human" | "ai") => {
    lastHtmlRef.current = html;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (source === "ai") {
      console.log("[AUTO-SAVE] ⚡ Salvamento imediato por alteração da IA...");
      saveToDatabase(html);
    } else {
      setSaveStatus("unsaved");
      console.log("[AUTO-SAVE] ⏳ Alteração humana detectada. Aguardando 5s de inatividade...");
      saveTimeoutRef.current = setTimeout(() => {
        console.log("[AUTO-SAVE] 💾 Salvando alterações humanas após 5s...");
        saveToDatabase(html);
      }, 5000);
    }
  }, [saveToDatabase]);

  // Garantia de integridade: salva imediatamente se o usuário tentar fechar a aba
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveTimeoutRef.current && lastHtmlRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveToDatabase(lastHtmlRef.current);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (saveTimeoutRef.current && lastHtmlRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveToDatabase(lastHtmlRef.current);
      }
    };
  }, [saveToDatabase]);

  useEffect(() => {
    if (!isRewriting && editQueue.length > 0) {
      const nextInstruction = editQueue[0];
      setEditQueue((prev) => prev.slice(1));
      if (editorRef.current?.handleOrbiRewrite) {
        editorRef.current.handleOrbiRewrite(nextInstruction);
      }
    }
  }, [isRewriting, editQueue]);

  // Integração com Gemini Voice WebSocket para alterações em tempo real
  const handleVoiceEditDocument = useCallback((instruction: string) => {
    console.log("[Gemini Voice] Instrução adicionada à fila:", instruction);
    setEditQueue((prev) => [...prev, instruction]);
  }, []);

  const handleVoiceFormatText = useCallback((action: string, targetText: string) => {
    console.log("[Gemini Voice] Formatação solicitada:", action, targetText);
    if (editorRef.current?.applyToolbarFormat) {
      editorRef.current.applyToolbarFormat(action, targetText);
    }
  }, []);

  const getDocumentText = () => {
    if (typeof window === "undefined") return "";
    const draft = localStorage.getItem("extrajus_draft");
    if (!draft) return "";
    const parser = new DOMParser();
    const doc = parser.parseFromString(draft, "text/html");
    const blocks = Array.from(doc.body.querySelectorAll("p, blockquote, h1, h2, h3, h4"));
    if (blocks.length > 0) {
      return blocks
        .map((el, idx) => `[Parágrafo ${idx + 1}] ${el.textContent?.trim()}`)
        .filter(t => t.length > 0)
        .join("\n\n");
    }
    return doc.body.textContent || "";
  };

  const {
    isVoiceActive,
    isConnecting: isVoiceConnecting,
    toggleVoice,
    audioLevel,
    isMuted,
    toggleMute,
    error: voiceError
  } = useDashboardVoice({
    onEditDocument: handleVoiceEditDocument,
    onFormatText: handleVoiceFormatText,
    documentId: currentDocId,
    extraContext: getDocumentText(),
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "pt-BR";

        rec.onstart = () => {
          setIsDictating(true);
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          setTextInput(prev => prev ? prev + " " + resultText : resultText);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsDictating(false);
        };

        rec.onend = () => {
          setIsDictating(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  const toggleDictation = () => {
    if (!recognition) {
      alert("Reconhecimento de fala não suportado neste navegador.");
      return;
    }
    if (isDictating) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const hasTriggeredGen = React.useRef(false);

  // Efeito de digitação suave / Progressive Stream Typewriter
  const startTypewriterStream = async (
    blocks: string[], 
    fullHtml: string, 
    docId: string | null,
    meta?: { title?: string; summary?: string; actionType?: string }
  ) => {
    // 1. Limpar o rascunho anterior e garantir posição no topo absoluto da página
    localStorage.setItem("extrajus_draft", "");
    window.dispatchEvent(new Event("storage_extrajus_draft"));

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    // 2. Fechar o overlay de loading e exibir a folha em branco limpa no topo
    setIsGenerating(false);
    setIsTypewriting(true);
    skipTypewritingRef.current = false;

    // 3. Pausa de 2 segundos para o usuário contemplar o início do zero no topo
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let accumulatedHtml = "";

    for (let i = 0; i < blocks.length; i++) {
      if (skipTypewritingRef.current) {
        break;
      }

      accumulatedHtml += (i > 0 ? "\n" : "") + blocks[i];
      localStorage.setItem("extrajus_draft", accumulatedHtml);
      window.dispatchEvent(new Event("storage_extrajus_draft"));

      // Rolagem suave automática acompanhando o documento sendo redigido (somente após os blocos iniciais)
      if (typeof window !== "undefined" && i >= 3) {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }

      // Intervalo refinado para leitura fluida e ritmo forense natural
      const delay = blocks[i].length > 300 ? 300 : blocks[i].length > 100 ? 220 : 160;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Ao terminar (ou se clicou em pular digitação)
    localStorage.setItem("extrajus_draft", fullHtml);
    window.dispatchEvent(new Event("storage_extrajus_draft"));
    setIsTypewriting(false);

    // Salva a versão final no banco de dados com título profissional e resumo gerado pela IA
    if (docId) {
      const payload: Record<string, any> = {
        content_html: fullHtml,
        status: "draft",
      };
      if (meta?.title) payload.title = meta.title;
      if (meta?.summary) payload.summary = meta.summary;
      if (meta?.actionType) payload.action_type = meta.actionType;

      fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(console.error);
    }
  };

  const generateDocument = async (factsToUse?: string, existingDocId?: string | null) => {
    const facts = factsToUse || localStorage.getItem("extrajus_facts");
    if (!facts) {
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);

    let docId = existingDocId || currentDocId;

    // Se ainda não temos um docId, cria UM único registro no banco
    if (!docId) {
      try {
        const createRes = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: facts.slice(0, 70).replace(/\n/g, " ") + "...",
            facts,
            status: "draft",
            content_html: ""
          })
        });

        if (createRes.status === 403) {
          const errData = await createRes.json();
          setIsGenerating(false);
          alert(errData.error || "Limite mensal de petições atingido.");
          window.location.href = "/dashboard";
          return;
        }

        if (createRes.ok) {
          const createData = await createRes.json();
          if (createData.document?.id) {
            docId = createData.document.id;
            setCurrentDocId(docId);
          }
        }
      } catch (e) {
        console.warn("Could not create document record in DB:", e);
      }
    }

    let retryCount = 0;
    let fullJsonText = "";
    let isComplete = false;

    while (retryCount <= 3 && !isComplete) {
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
      }

      try {
        const response = await fetch("/api/gemini/document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facts, attempt: retryCount }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Erro da API de geração:", errorData);
          throw new Error(`Falha na geração: ${errorData.error || response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              fullJsonText += chunk;
            }
          } catch (streamError) {
            const streamMsg = streamError instanceof Error ? streamError.message : String(streamError);
            console.warn(`Stream interrompido na tentativa ${retryCount + 1}: ${streamMsg}`);
          }

          // Parse JSON e inicia digitação progressiva
          try {
            let cleanJsonStr = fullJsonText.trim();
            if (cleanJsonStr.startsWith("```json")) {
              cleanJsonStr = cleanJsonStr.replace(/^```json/, "").replace(/```$/, "").trim();
            } else if (cleanJsonStr.startsWith("```")) {
              cleanJsonStr = cleanJsonStr.replace(/^```/, "").replace(/```$/, "").trim();
            }

            const parsedJson: PeticaoDocumentJson = JSON.parse(cleanJsonStr);
            const blocks = getPeticaoBlocks(parsedJson);
            const renderedHtml = renderPeticaoJsonToHtml(parsedJson);

            const meta = {
              title: parsedJson.titulo || parsedJson.partes?.tipoAcao || undefined,
              summary: parsedJson.resumo || undefined,
              actionType: parsedJson.partes?.tipoAcao || undefined,
            };

            isComplete = true;

            // Inicia o efeito progressivo de redação ao vivo
            await startTypewriterStream(blocks, renderedHtml, docId, meta);
          } catch (jsonErr) {
            console.warn("JSON ainda incompleto ou inválido na tentativa:", retryCount + 1, jsonErr);
            retryCount++;
          }
        } else {
          retryCount++;
        }
      } catch (error) {
        console.error(`Tentativa ${retryCount + 1} falhou:`, error);
        retryCount++;
      }
    }

    setIsGenerating(false);
    if (docId) {
      window.history.replaceState({}, document.title, `/editor?id=${docId}`);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    if (hasTriggeredGen.current) return;

    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    const isGenerate = params.get("generate") === "true";

    if (idParam) {
      hasTriggeredGen.current = true;
      setCurrentDocId(idParam);
      // Carregar documento do Supabase
      fetch(`/api/documents/${idParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.document) {
            if (data.document.content_html) {
              localStorage.setItem("extrajus_draft", data.document.content_html);
              window.dispatchEvent(new Event("storage_extrajus_draft"));
            }
            if (data.document.facts) {
              localStorage.setItem("extrajus_facts", data.document.facts);
            }
            if (isGenerate && !data.document.content_html) {
              generateDocument(data.document.facts, idParam);
            }
          }
        })
        .catch(console.error);
    } else if (isGenerate) {
      hasTriggeredGen.current = true;
      setIsGenerating(true);
      generateDocument();
    } else {
      const facts = localStorage.getItem("extrajus_facts");
      const draft = localStorage.getItem("extrajus_draft");
      if (!facts && !draft) {
        window.location.href = "/";
        return;
      }
    }

    return () => {};
  }, []);

  const handleDownloadDocx = async () => {
    const draft = localStorage.getItem("extrajus_draft") || "";
    if (!draft) {
      alert("O documento está vazio.");
      return;
    }

    setIsDownloading(true);

    try {
      // Marca no banco de dados como CONCLUÍDO (completed) ao baixar
      if (currentDocId) {
        fetch(`/api/documents/${currentDocId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "completed",
            content_html: draft
          })
        }).catch(console.error);
      }

      const response = await fetch("/api/document/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Peticao_Inicial_SmartDoc",
          content: draft
        })
      });

      if (!response.ok) throw new Error("Erro na exportação para DOCX");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "peticao_inicial.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Falha ao baixar o arquivo DOCX. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!mounted) {
    return <main className="min-h-screen bg-background" />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground relative">
      {/* ── Overlay de Carregamento Inicial (Sem piscar editor vazio) ── */}
      <LoadingOverlay isGenerating={isGenerating} />

      {/* ── Barra de Status da Redação ao Vivo (Typewriter Mode) ── */}
      {isTypewriting && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[1500] flex items-center gap-3 rounded-full border border-primary/40 bg-card/95 px-4 py-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
          <span className="flex size-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span>Redigindo petição ao vivo com IA...</span>
          </span>
          <button
            onClick={() => {
              skipTypewritingRef.current = true;
            }}
            className="text-[11px] font-bold text-primary hover:underline pl-2 border-l border-border/80 cursor-pointer flex items-center gap-1"
          >
            <span>Concluir Agora</span>
            <FastForward className="size-3" />
          </button>
        </div>
      )}

      <div className="w-full pb-20">
        <SimpleEditor
          ref={editorRef}
          editable={!isTypewriting && !isGenerating}
          isGenerating={isGenerating || isTypewriting}
          isRewriting={isRewriting}
          setIsRewriting={setIsRewriting}
          isPaid={true}
          onActiveEditChange={setHasActiveEdit}
          onContentChange={handleContentChange}
          leftContent={
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Painel</span>
              </Link>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground pl-1">
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1 text-primary">
                    <Loader2 className="size-3 animate-spin" />
                    <span>Salvando...</span>
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1 text-emerald-500 font-medium">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>Salvo</span>
                  </span>
                )}
                {saveStatus === "unsaved" && (
                  <span className="flex items-center gap-1 text-amber-500/80">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Alterações pendentes...</span>
                  </span>
                )}
              </div>
            </div>
          }
        >
          {!isGenerating && !isTypewriting && (
            <div className="flex w-full flex-col items-center justify-center gap-4 rounded-b-2xl border-t border-border bg-card p-6 sm:p-8 text-center">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Petição Pronta para Uso
                </h3>
                <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
                  Você pode editar o texto livremente no editor acima ou fazer o download do arquivo Word (.docx).
                </p>
              </div>

              <button
                onClick={handleDownloadDocx}
                disabled={isDownloading}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
              >
                {isDownloading ? (
                  <span className="animate-pulse">Exportando...</span>
                ) : (
                  <>
                    <FileDown size={18} />
                    <span>Baixar Documento (.docx)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </SimpleEditor>

        <FloatingAiBar
          isGenerating={isGenerating || isTypewriting}
          isPaid={true}
          isRewriting={isRewriting}
          textInput={textInput}
          setTextInput={setTextInput}
          onSend={(text) => {
            editorRef.current?.handleOrbiRewrite(text);
            setTextInput("");
          }}
          isDictating={isDictating}
          toggleDictation={toggleDictation}
          hasActiveEdit={hasActiveEdit}
        />

        {/* ── Botão Flutuante Gemini Voice (Beta) - Ocultado Temporariamente ── */}
        {/*
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {isVoiceActive && (
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-background/95 px-3 py-1.5 text-xs shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-medium text-foreground text-[11px]">
                {audioLevel > 0.08 ? "IA falando..." : "Ouvindo você..."}
              </span>
              <button
                onClick={toggleMute}
                title={isMuted ? "Desmutar" : "Mutar áudio"}
                className="ml-1 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                {isMuted ? <MicOff size={13} className="text-red-400" /> : <Mic size={13} />}
              </button>
            </div>
          )}

          <button
            onClick={toggleVoice}
            disabled={isVoiceConnecting}
            title={isVoiceActive ? "Encerrar conversa por voz" : "Conversar por Voz em tempo real com a IA (Beta)"}
            className={`group relative flex items-center gap-2.5 rounded-full px-4 py-2.5 text-xs font-semibold shadow-xl backdrop-blur-xl transition-all active:scale-95 cursor-pointer border ${
              isVoiceActive
                ? "bg-red-500/10 border-red-500/40 text-red-500 hover:bg-red-500/20 hover:border-red-500/60 ring-2 ring-red-500/20"
                : "bg-card/90 hover:bg-card border-border/90 hover:border-primary/40 text-foreground hover:shadow-primary/5"
            }`}
          >
            {isVoiceConnecting ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : isVoiceActive ? (
              <Radio className="size-4 animate-pulse text-red-500" />
            ) : (
              <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Mic className="size-3" />
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span>{isVoiceConnecting ? "Conectando..." : isVoiceActive ? "Desconectar Voz" : "Voz em Tempo Real"}</span>
              <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary uppercase tracking-wider">
                BETA
              </span>
            </div>
          </button>
        </div>
        */}
      </div>
    </main>
  );
}
