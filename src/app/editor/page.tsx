"use client";

import React, { useEffect, useState } from "react";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { useGeminiLive } from "@/hooks/use-gemini-live";
import { FileDown } from "lucide-react";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { SimpleEditorRef } from "@/components/tiptap-templates/simple/simple-editor";

import { DiscountBanner } from "@/components/editor/DiscountBanner";
import { LoadingOverlay } from "@/components/editor/LoadingOverlay";
import { PaymentModal } from "@/components/editor/PaymentModal";
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
  const [isPaid, setIsPaid] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamStarted, setStreamStarted] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [hasActiveEdit, setHasActiveEdit] = useState(false);

  // Payment States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(true);
  const [isLoadingPix, setIsLoadingPix] = useState(false);
  const [pixData, setPixData] = useState<{ pixCode: string; externalId: string } | null>(null);

  // Multi-step Checkout States
  const [paymentStep, setPaymentStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [upsellLawyer, setUpsellLawyer] = useState(false);
  const [upsellWhatsapp, setUpsellWhatsapp] = useState(false);
  // Scarcity & Negotiation States
  const [discountActive, setDiscountActive] = useState(false);
  const [discountTimeLeft, setDiscountTimeLeft] = useState(120); // 2 min
  const [price, setPrice] = useState(29.00);
  const [textInput, setTextInput] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

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
    if (name === "apply_discount") {
      setDiscountActive(true);
      const newPrice = typeof args.new_price === 'number' ? args.new_price : 27.00;
      setPrice(newPrice);
      const timerMinutes = typeof args.timer_minutes === 'number' ? args.timer_minutes : 2;
      setDiscountTimeLeft(timerMinutes * 60);
    } else if (name === "edit_document") {
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Timer de 2 minutos mágico e restrição de conexão
  useEffect(() => {
    // Se o desconto estiver ativo, mas o usuário desligar, perde o desconto imediatamente
    if (discountActive && !isConnected && !isPaid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDiscountActive(false);
      setPrice(39.00);
      setDiscountTimeLeft(0);
      return;
    }

    if (!discountActive || discountTimeLeft <= 0) return;

    const interval = setInterval(() => {
      setDiscountTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setDiscountActive(false);
          setPrice(39.00);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [discountActive, discountTimeLeft, isConnected, isPaid]);

  // Proactive Ping (45s Inactivity)
  useEffect(() => {
    if (!isConnected || isPaid || isGenerating) return;

    const timeout = setTimeout(() => {
      sendMessage("SYSTEM: O usuário está há 45 segundos parado sem interagir. Faça um comentário prestativo e simpático com sua personalidade marcante perguntando se ele quer fazer mais alguma alteração ou se tem alguma dúvida sobre a Notificação Extrajudicial.");
    }, 45000);

    return () => clearTimeout(timeout);
  }, [isConnected, isPaid, isGenerating, sendMessage]);

  // Payment success handler
  const handlePaymentSuccess = async (email: string, name: string, amount: number) => {
    setIsPaid(true);
    setIsPaymentModalOpen(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("extrajus_payment_status", "paid");
    }

    const hasOrderBump = upsellLawyer || upsellWhatsapp;

    // Trigger confirmation email via Resend
    try {
      const facts = localStorage.getItem("extrajus_facts") || "";
      const draft = localStorage.getItem("extrajus_draft") || "";

      await fetch("/api/payment/confirm-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          amount,
          hasOrderBump,
          upsellLawyer,
          upsellWhatsapp,
          phone: customerPhone,
          facts,
          draft
        })
      });
    } catch (error) {
      console.error("Erro ao enviar e-mail de confirmação", error);
    }
  };

  // Polling for payment status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isPaymentModalOpen && pixData?.externalId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/payment/status?externalId=${pixData.externalId}&id=${(pixData as any).id || ""}`);
          const data = await res.json();

          if (data.status === "COMPLETE") {
            const finalPrice = price + (upsellLawyer ? 67.00 : 0) + (upsellWhatsapp ? 19.90 : 0);
            handlePaymentSuccess(customerEmail, customerName, finalPrice);
            clearInterval(intervalId);

            if (typeof window !== "undefined" && "gtag" in window) {
              const g = (window as unknown as { gtag: (type: string, action: string, data: Record<string, unknown>) => void }).gtag;
              g('event', 'conversion', {
                'send_to': 'AW-18263949464/rL2JCPWf7cMcEJiB94RE',
                'value': finalPrice,
                'currency': 'BRL',
                'transaction_id': pixData.externalId
              });
            }
          }
        } catch (error) {
          console.error("Erro no polling de pagamento", error);
        }
      }, 3000); // Checa a cada 3 segundos
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPaymentModalOpen, pixData, customerEmail, customerName, price, upsellLawyer, upsellWhatsapp]);

  const generateDocument = async () => {
    const facts = localStorage.getItem("extrajus_facts");
    if (!facts) return;

    setIsGenerating(true);
    setStreamStarted(false);

    let retryCount = 0;
    let fullHtml = "";
    let isComplete = false;

    while (retryCount <= 4 && !isComplete) {
      // Backoff entre tentativas: 0s, 2s, 4s, 6s, 8s
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
            // Continua a execução para verificar se está incompleto e fazer retry
          }

          // Verifica se o documento terminou corretamente
          if (fullHtml.includes("Notificante")) {
            isComplete = true;
            if (typeof window !== "undefined" && "gtag" in window) {
              const g = (window as unknown as { gtag: (type: string, action: string, data: Record<string, unknown>) => void }).gtag;
              g('event', 'conversion', {
                'send_to': 'AW-18263949464/JsWBCPyw7MMcEJiB94RE',
                'value': 1.0,
                'currency': 'BRL'
              });
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
    window.history.replaceState({}, document.title, "/editor");
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("generate") === "true") {
      setIsGenerating(true);
      generateDocument();
    } else {
      const facts = localStorage.getItem("extrajus_facts");
      const draft = localStorage.getItem("extrajus_draft");
      if (!facts && !draft) {
        localStorage.removeItem("extrajus_checkout_started");
        window.location.href = "/";
        return;
      }
    }

    if (localStorage.getItem("extrajus_payment_status") === "paid") {
      setIsPaid(true);
      setIsPaymentModalOpen(false);
    } else if (localStorage.getItem("extrajus_checkout_started") === "true") {
      setIsPaymentModalOpen(true);
    }

    return () => {
      // Remover a limpeza automática para permitir a persistência
    };
  }, []);

  const handlePaymentRequest = async () => {
    setIsPaymentModalOpen(true);
    setPaymentStep(1);
    localStorage.setItem("extrajus_checkout_started", "true");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }
    setCustomerPhone(value);
  };

  const handleGeneratePix = async () => {
    setPaymentStep(2);
    setIsLoadingPix(true);

    if (typeof window !== "undefined" && "gtag" in window) {
      const g = (window as unknown as { gtag: (type: string, action: string, data: Record<string, unknown>) => void }).gtag;
      g('event', 'conversion', {
        'send_to': 'AW-18263949464/PoDHCPCn2MMcEJiB94RE',
        'value': 5.0,
        'currency': 'BRL'
      });
    }

    // Calcula total com upsells
    let finalPrice = price;
    if (upsellLawyer) finalPrice += 67.00; // Placeholder price
    if (upsellWhatsapp) finalPrice += 19.90; // Placeholder price

    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: finalPrice })
      });
      const data = await response.json();

      if (data.pixCode) {
        setPixData(data);
        if (isConnected) {
          sendMessage(`SYSTEM: O QR Code do PIX foi gerado na tela com sucesso no valor de R$ ${finalPrice.toFixed(2).replace('.', ',')}! Fale que está tudo certo, o desconto está garantido, e peça para ele escanear o QR Code ou usar o PIX Copia e Cola. Diga que assim que o banco aprovar (geralmente em segundos), o documento é liberado instantaneamente na tela.`);
        }
      } else {
        alert("Erro ao gerar PIX: " + (data.error || "Desconhecido"));
        setPaymentStep(1); // Volta pro passo anterior
      }
    } catch (error) {
      console.error("Payment error", error);
      alert("Erro de conexão ao gerar PIX");
      setPaymentStep(1);
    } finally {
      setIsLoadingPix(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode);
      alert("Código PIX copiado!");
    }
  };

  const simulatePaymentSuccess = () => {
    const finalPrice = price + (upsellLawyer ? 67.00 : 0) + (upsellWhatsapp ? 19.90 : 0);
    handlePaymentSuccess(customerEmail || "contato@smartdoc.work", customerName || "Usuário Teste", finalPrice);

    if (typeof window !== "undefined" && "gtag" in window) {
      const g = (window as unknown as { gtag: (type: string, action: string, data: Record<string, unknown>) => void }).gtag;
      g('event', 'conversion', {
        'send_to': 'AW-18263949464/rL2JCPWf7cMcEJiB94RE',
        'value': finalPrice,
        'currency': 'BRL',
        'transaction_id': pixData?.externalId || `simulated_${Date.now()}`
      });
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadDocx = async () => {
    const draft = localStorage.getItem("extrajus_draft") || "";
    if (!draft) {
      alert("O documento está vazio.");
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch("/api/document/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Notificacao_Extrajudicial",
          content: draft
        })
      });

      if (!response.ok) throw new Error("Erro na exportação para DOCX");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "notificacao_extrajudicial.docx";
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

  const isDev = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.includes("local"));

  if (!mounted) {
    return <main style={{ minHeight: "100vh", background: "var(--bg)" }} />;
  }

  return (
    <main style={{
      minHeight: "100vh",
      fontFamily: "var(--font-sans), sans-serif",
      color: "var(--text-primary)"
    }}>
      <div style={{
        background: "transparent",
        padding: "0 0 80px 0",
        width: "100%",
        boxSizing: "border-box"
      }}>

        <SimpleEditor
          ref={editorRef}
          editable={true}
          onUnlockRequest={handlePaymentRequest}
          isGenerating={isGenerating}
          discountActive={discountActive}
          discountTimerDisplay={`${String(Math.floor(discountTimeLeft / 60)).padStart(2, '0')}:${String(discountTimeLeft % 60).padStart(2, '0')}`}
          price={price}
          isRewriting={isRewriting}
          setIsRewriting={setIsRewriting}
          isPaid={isPaid}
          onActiveEditChange={setHasActiveEdit}
        >
          <DiscountBanner
            discountActive={discountActive}
            discountTimeLeft={discountTimeLeft}
            isPaid={isPaid}
            isMobile={isMobile}
          />

          <LoadingOverlay
            mounted={mounted}
            isGenerating={isGenerating}
            streamStarted={streamStarted}
          />

          {isPaid ? (
            <div style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: isMobile ? "32px 20px" : "48px 48px",
              background: "var(--surface)",
              borderTop: "1px solid var(--border)",
              borderRadius: "0 0 12px 12px",
              boxSizing: "border-box",
              marginTop: "0px",
              color: "var(--text-primary)"
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                boxShadow: "0 0 30px rgba(16, 185, 129, 0.1)"
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>

              <h2 style={{
                fontSize: isMobile ? "22px" : "28px",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "8px",
                letterSpacing: "-0.02em"
              }}>
                Pagamento Confirmado!
              </h2>
              <p style={{
                color: "var(--text-secondary)",
                fontSize: isMobile ? "14px" : "15px",
                textAlign: "center",
                maxWidth: "400px",
                marginBottom: "32px",
                lineHeight: "1.5"
              }}>
                Sua notificação foi desbloqueada. O editor completo está liberado acima e você já pode baixar o documento.
              </p>

               <button
                 onClick={handleDownloadDocx}
                 disabled={isDownloading}
                 style={{
                   background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                   color: "white",
                   border: "1px solid rgba(255,255,255,0.1)",
                   padding: isMobile ? "16px 24px" : "18px 36px",
                   borderRadius: "14px",
                   fontSize: "16px",
                   fontWeight: 800,
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   gap: "10px",
                   cursor: "pointer",
                   boxShadow: "0 8px 24px rgba(16, 185, 129, 0.25)",
                   transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                   width: isMobile ? "100%" : "auto"
                 }}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.transform = "translateY(-2px)";
                   e.currentTarget.style.boxShadow = "0 12px 32px rgba(16, 185, 129, 0.35)";
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.transform = "translateY(0)";
                   e.currentTarget.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.25)";
                 }}
              >
                {isDownloading ? (
                  <span className="animate-pulse">Exportando...</span>
                ) : (
                  <>
                    <FileDown size={22} />
                    Baixar Documento (.docx)
                  </>
                )}
              </button>
            </div>
          ) : (
            !isGenerating && (
              <div style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginTop: "0px",
                position: "relative",
                zIndex: 10
              }}>

                {/* Subtle Amber Glow to guide visual interest */}
                <div style={{
                  position: "absolute",
                  bottom: "20px",
                  width: "280px",
                  height: "180px",
                  background: discountActive
                    ? "radial-gradient(ellipse at 50% 50%, rgba(239,68,68,0.05) 0%, transparent 70%)"
                    : "radial-gradient(ellipse at 50% 50%, rgba(217,119,6,0.05) 0%, transparent 70%)",
                  pointerEvents: "none",
                  zIndex: 0,
                }} />

                {/* Status pill inside sheet */}
                {discountActive && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "5px 14px",
                    borderRadius: "999px",
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.15)",
                    color: "#ef4444",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                    marginBottom: "20px",
                    zIndex: 1,
                  }}>
                    <span style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "currentColor",
                      animation: "pulse 1.8s ease-in-out infinite",
                      display: "inline-block",
                    }} />
                    {`Oferta expira em ${String(Math.floor(discountTimeLeft / 60)).padStart(2, '0')}:${String(discountTimeLeft % 60).padStart(2, '0')}`}
                  </div>
                )}

                {/* Integrated Container spanning edge-to-edge */}
                <div style={{
                  width: "100%",
                  background: "var(--surface)",
                  borderTop: "none", // Removido para integração perfeita com o blur
                  borderLeft: "none",
                  borderRight: "none",
                  borderBottom: "none",
                  borderRadius: "0 0 12px 12px",
                  marginTop: "-10px", // Puxar levemente para cima sob o blur
                  padding: isMobile ? "16px 16px" : "32px 48px",
                  zIndex: 1,
                  textAlign: "center",
                  boxSizing: "border-box"
                }}>
                  <PaymentModal
                    isOpen={true}
                    onClose={() => {
                      setPaymentStep(1);
                      setPixData(null);
                    }}
                    paymentStep={paymentStep}
                    customerName={customerName}
                    setCustomerName={setCustomerName}
                    customerEmail={customerEmail}
                    setCustomerEmail={setCustomerEmail}
                    customerPhone={customerPhone}
                    handlePhoneChange={handlePhoneChange}
                    upsellLawyer={upsellLawyer}
                    setUpsellLawyer={setUpsellLawyer}
                    upsellWhatsapp={upsellWhatsapp}
                    setUpsellWhatsapp={setUpsellWhatsapp}
                    price={price}
                    discountActive={discountActive}
                    isRewriting={isRewriting}
                    handleGeneratePix={handleGeneratePix}
                    isMobile={isMobile}
                    isDev={isDev}
                    isLoadingPix={isLoadingPix}
                    pixData={pixData}
                    handleCopyPix={handleCopyPix}
                    simulatePaymentSuccess={simulatePaymentSuccess}
                    inline={true}
                  />
                </div>
              </div>
            )
          )}
        </SimpleEditor>

        {!isPaid && (!isPaymentModalOpen || paymentStep !== 2) && !pixData && (
          <FloatingAiBar
            isGenerating={isGenerating}
            isPaid={isPaid}
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
        )}
      </div>
    </main>
  );
}
