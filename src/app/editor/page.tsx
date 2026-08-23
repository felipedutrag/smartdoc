"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { useGeminiLive } from "@/hooks/use-gemini-live";
import { FileDown, ArrowLeft } from "lucide-react";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { SimpleEditorRef } from "@/components/tiptap-templates/simple/simple-editor";
import Link from "next/link";

import { LoadingOverlay } from "@/components/editor/LoadingOverlay";
import { FloatingAiBar } from "@/components/editor/FloatingAiBar";

const cleanMarkdownBold = (html: string): string => {
  if (!html) return "";
  let cleaned = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  cleaned = cleaned.replace(/__(.*?)__/g, "<strong>$1</strong>");
  return cleaned;
};

export default function EditorPage() {
  const isMobileRaw = useIsBreakpoint("max", 860);
  const isMobile = isMobileRaw ?? false;
  const editorRef = React.useRef<SimpleEditorRef>(null);
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [hasActiveEdit, setHasActiveEdit] = useState(false);

  const [textInput, setTextInput] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleToolCall = React.useCallback(async (name: string, args: Record<string, unknown>) => {
    if (name === "edit_document") {
      const instruction = typeof args.instruction === 'string' ? args.instruction : "";
      if (instruction) {
        await editorRef.current?.handleOrbiRewrite(instruction);
      }
    }
  }, []);

  const [documentContext, setDocumentContext] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const facts = localStorage.getItem("extrajus_facts") || "";
    const draft = localStorage.getItem("extrajus_draft") || "";
    if (facts || draft) {
      const newContext = `Fatos narrados: ${facts}\n\nRascunho atual do documento: ${draft.substring(0, 3000)}`;
      setDocumentContext(prev => prev !== newContext ? newContext : prev);
    }
  }, []);

  const {
    sendMessage,
    isConnected,
    isRecording,
    stopLiveDialog,
    connect,
  } = useGeminiLive(undefined, '/api/config/gemini-editor-setup', handleToolCall, documentContext);

  const toggleVoiceCapture = () => {
    if (isConnected || isRecording) {
      stopLiveDialog();
    } else {
      connect();
    }
  };

  const hasTriggeredGen = React.useRef(false);

  const generateDocument = async (factsToUse?: string, existingDocId?: string | null) => {
    const facts = factsToUse || localStorage.getItem("extrajus_facts");
    if (!facts) {
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    setStreamStarted(false);

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
    let fullHtml = "";
    let isComplete = false;

    while (retryCount <= 4 && !isComplete) {
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
      }

      try {
        const response = await fetch("/api/gemini/document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ facts, continueFrom: fullHtml, attempt: retryCount }),
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
              fullHtml += chunk;

              setStreamStarted(true);
              const cleaned = cleanMarkdownBold(fullHtml);
              localStorage.setItem("extrajus_draft", cleaned);
              window.dispatchEvent(new Event("storage_extrajus_draft"));
            }
          } catch (streamError) {
            const streamMsg = streamError instanceof Error ? streamError.message : String(streamError);
            console.warn(`Stream interrompido na tentativa ${retryCount + 1}: ${streamMsg}`);
          }

          if (fullHtml.toLowerCase().includes("deferimento") || fullHtml.toLowerCase().includes("advogado")) {
            isComplete = true;
            
            // Salva o conteúdo final no banco mantendo como rascunho até que o advogado finalize/baixe
            if (docId) {
              fetch(`/api/documents/${docId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  content_html: cleanMarkdownBold(fullHtml),
                  status: "draft",
                })
              }).catch(console.error);
            }
          } else {
            console.warn(`Documento incompleto na tentativa ${retryCount + 1}. Tentando continuar...`);
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
    setStreamStarted(false);
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="w-full pb-20">
        <SimpleEditor
          ref={editorRef}
          editable={true}
          isGenerating={isGenerating}
          isRewriting={isRewriting}
          setIsRewriting={setIsRewriting}
          isPaid={true}
          onActiveEditChange={setHasActiveEdit}
          leftContent={
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Painel</span>
            </Link>
          }
        >
          <LoadingOverlay
            mounted={mounted}
            isGenerating={isGenerating}
            streamStarted={streamStarted}
          />

          {!isGenerating && (
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
          isGenerating={isGenerating}
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
      </div>
    </main>
  );
}
