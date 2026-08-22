"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  FileText,
  Cpu,
  CheckCircle2,
  Sliders,
  ChevronDown,
  Layers,
  FileCode2,
  Terminal,
  MousePointerClick,
  Scale
} from "lucide-react";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";

export default function Home() {
  const [isDark, setIsDark] = useState<boolean | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isMobileRaw = useIsBreakpoint("max", 768);
  const isMobile = isMobileRaw ?? false;

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && document.documentElement.classList.contains("dark"))) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "pt-BR";

      rec.onstart = () => setIsDictating(true);
      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTextInput(prev => prev ? prev + " " + resultText : resultText);
      };
      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== "no-speech") setIsDictating(false);
      };
      rec.onend = () => setIsDictating(false);
      setRecognition(rec);
    }
  }, []);

  const toggleDictation = () => {
    if (!recognition) {
      alert("Reconhecimento de fala não suportado neste navegador. Recomendamos o Google Chrome ou Microsoft Edge.");
      return;
    }
    if (isDictating) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleGenerate = (customText?: string) => {
    const textToUse = customText || textInput;
    if (!textToUse.trim() || redirecting) return;
    setRedirecting(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("extrajus_facts", textToUse);
      localStorage.removeItem("extrajus_payment_status");
      window.location.href = "/editor?generate=true";
    }
  };

  const scrollToGenerator = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const textarea = document.querySelector(".home-textarea") as HTMLTextAreaElement;
    if (textarea) textarea.focus();
  };

  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-sans), sans-serif",
        color: "var(--text-primary)",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* ── Ambient Linear Background Glows & Grids ── */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `
          radial-gradient(circle, var(--grid-color) 1.2px, transparent 1.2px),
          linear-gradient(to right, var(--grid-color) 0.8px, transparent 0.8px),
          linear-gradient(to bottom, var(--grid-color) 0.8px, transparent 0.8px)
        `,
        backgroundSize: "36px 36px, 72px 72px, 72px 72px",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.35,
      }} />

      {/* Glow Orbs */}
      <div style={{
        position: "absolute",
        top: "-100px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "800px",
        height: "400px",
        background: "radial-gradient(ellipse at 50% 30%, rgba(217, 119, 6, 0.15), rgba(217, 119, 6, 0.02) 60%, transparent 80%)",
        filter: "blur(70px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* ── Navigation Bar (Linear Style) ── */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 20px 0",
          zIndex: 50,
          position: "sticky",
          top: 0,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 24px",
            width: "100%",
            maxWidth: "1160px",
            background: "var(--header-pill-bg)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: "16px",
            border: "var(--header-pill-border)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            position: "relative",
          }}
        >
          {/* Logo */}
          <a
            href="/"
            style={{
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
              position: "relative",
              fontFamily: "var(--font-sans), sans-serif",
            }}
          >
            <span style={{ fontWeight: 600, letterSpacing: "-0.04em" }}>SMART</span>
            <span style={{ fontWeight: 900, color: "#d97706", letterSpacing: "-0.04em", marginLeft: 2 }}>DOC</span>
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -24,
                background: "rgba(217, 119, 6, 0.12)",
                border: "1px solid rgba(217, 119, 6, 0.3)",
                color: "#d97706",
                fontSize: 8,
                fontWeight: 900,
                padding: "1px 5px",
                borderRadius: "4px",
              }}
            >
              PRO
            </span>
          </a>

          {/* Center Links (Desktop only) - ABSOLUTELY CENTERED */}
          {!isMobile && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                alignItems: "center",
                gap: "28px",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                pointerEvents: "auto",
              }}
            >
              <a href="#recursos" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>Recursos</a>
              <a href="#como-funciona" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>Como Funciona</a>
              <a href="#faq" style={{ color: "inherit", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"} onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>Dúvidas</a>
            </div>
          )}

          {/* Right Actions: Theme Toggle + Action Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => {
                const newTheme = !isDark;
                setIsDark(newTheme);
                if (newTheme) {
                  document.documentElement.classList.add("dark");
                  document.documentElement.classList.remove("light");
                  localStorage.setItem("theme", "dark");
                } else {
                  document.documentElement.classList.remove("dark");
                  document.documentElement.classList.add("light");
                  localStorage.setItem("theme", "light");
                }
              }}
              aria-label="Alternar tema"
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "var(--theme-btn-bg)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
                transition: "all 0.2s",
              }}
            >
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>

            <a
              href="/login"
              style={{
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 14px",
                borderRadius: "8px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
            >
              Entrar
            </a>

            <a
              href="/register"
              style={{
                background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                padding: "8px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 10px rgba(217, 119, 6, 0.25)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
              onMouseLeave={(e) => e.currentTarget.style.filter = "brightness(1)"}
            >
              <span>Criar Conta</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: isMobile ? "40px 16px 60px" : "60px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: "860px", width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          {/* Release Pill Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(217, 119, 6, 0.08)",
              border: "1px solid rgba(217, 119, 6, 0.25)",
              color: "#d97706",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.02em",
              marginBottom: "20px",
              boxShadow: "0 2px 10px rgba(217, 119, 6, 0.05)",
            }}
          >
            <Zap size={14} />
            <span>Motor Jurídico de Alta Velocidade para Advogados</span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: "clamp(34px, 5.5vw, 56px)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.08,
              color: "var(--text-primary)",
              marginBottom: "20px",
            }}
          >
            Petições Judiciais completas, <br />
            <span style={{
              background: "linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 800
            }}>
              redigidas em poucos segundos.
            </span>
          </h1>

          <p
            style={{
              fontSize: "clamp(15px, 2vw, 18px)",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: "680px",
              marginBottom: "36px",
            }}
          >
            Narre os fatos do seu cliente por texto ou voz. Nossa IA estruturada elabora a petição inicial com fundamentação legal, doutrina, jurisprudência e formatação pronta para o PJe.
          </p>

          {/* ── Hero Call to Action Buttons ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "14px",
              marginBottom: "36px",
            }}
          >
            <a
              href="/register"
              style={{
                background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                padding: "14px 32px",
                borderRadius: "14px",
                fontSize: "15px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 8px 24px rgba(217, 119, 6, 0.35)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>Criar Conta Gratuita</span>
              <ArrowRight size={18} />
            </a>

            <a
              href="/login"
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                padding: "14px 28px",
                borderRadius: "14px",
                fontSize: "15px",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#d97706";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>Acessar Painel</span>
            </a>
          </div>

          {/* Sub Hero Micro Badges */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "20px",
              marginTop: "10px",
              color: "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={15} style={{ color: "#10b981" }} />
              <span>Petições completas com Fatos, Direito e Pedidos</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={15} style={{ color: "#10b981" }} />
              <span>Exportação nativa em .docx (Word)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={15} style={{ color: "#10b981" }} />
              <span>Edição em tempo real com IA cirúrgica</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── PRODUCT PREVIEW (Linear-style Mockup Window) ── */}
      <section
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "0 20px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "780px",
            borderRadius: "20px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.3)",
            overflow: "hidden",
          }}
        >
          {/* Mockup Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              borderBottom: "1px solid var(--border)",
              background: "var(--header-pill-bg)",
            }}
          >
            <div style={{ display: "flex", gap: "6px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
              editor.smartdoc.work — peticao_inicial.docx
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#10b981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                IA Ativa
              </span>
            </div>
          </div>

          {/* Mockup Document Body */}
          <div
            style={{
              padding: isMobile ? "24px 20px" : "44px 72px",
              background: "var(--bg)",
              fontFamily: "'Georgia', serif",
              lineHeight: 1.75,
              fontSize: "14px",
              color: "var(--text-primary)",
              opacity: 0.95,
            }}
          >
            <p style={{ textAlign: "justify", fontWeight: "bold", textTransform: "uppercase", marginBottom: "20px", fontSize: "13.5px" }}>
              EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE SÃO PAULO/SP
            </p>
            <p style={{ textAlign: "justify", marginBottom: "16px" }}>
              <strong>[NOME DO AUTOR]</strong>, brasileiro, solteiro, empresário, inscrito no CPF sob o nº [Número], residente em [Endereço Completo], por seu advogado que esta subscreve, vem propor a presente
            </p>
            <h3 style={{ textAlign: "center", textTransform: "uppercase", fontSize: "15px", margin: "22px 0", letterSpacing: "0.02em", color: "#d97706" }}>
              AÇÃO DE RESCISÃO CONTRATUAL C/C INDENIZATÓRIA
            </h3>
            <p style={{ textAlign: "justify", marginBottom: "18px" }}>
              em face de <strong>[NOME DO RÉU]</strong>, pelos fatos e fundamentos a seguir aduzidos.
            </p>
            <div style={{
              margin: "24px 0 6px",
              padding: "14px 20px",
              background: "rgba(217, 119, 6, 0.06)",
              borderLeft: "3px solid #d97706",
              borderRadius: "0 10px 10px 0",
              fontSize: "13px",
              fontStyle: "italic",
              fontFamily: "var(--font-sans), sans-serif",
            }}>
              💡 <strong>Visual Law Integrado:</strong> A petição já é gerada estruturada em tópicos claros, sem marcadores confusos e com pedidos em alíneas precisas (a, b, c).
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID: RECURSOS PROJETADOS PARA ALTA PERFORMANCE ── */}
      <section
        id="recursos"
        style={{
          width: "100%",
          maxWidth: "1160px",
          margin: "0 auto",
          padding: "40px 20px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Arquitetura Jurídica
          </span>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 700, letterSpacing: "-0.03em", marginTop: "8px" }}>
            Tudo o que seu escritório precisa para produzir mais rápido.
          </h2>
        </div>

        {/* Bento Grid Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          {/* Card 1 (Span 2 cols on Desktop) */}
          <div
            style={{
              gridColumn: isMobile ? "1" : "span 2",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div>
              <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(217, 119, 6, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706", marginBottom: "16px" }}>
                <Scale size={20} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px" }}>
                Fundamentação Técnica e Jurisprudência Coerente
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14.5px", lineHeight: 1.6, maxWidth: "560px" }}>
                Chega de modelos genéricos ou petições vazias. Nosso modelo foi instruído para citar artigos pertinentes da legislação brasileira (CPC, CC, CDC, CLT) e construir teses jurídicas sólidas com base estrita no caso narrado.
              </p>
            </div>
            <div style={{ marginTop: "24px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", background: "var(--surface-elevated)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                ⚖️ Código de Processo Civil
              </span>
              <span style={{ fontSize: "12px", background: "var(--surface-elevated)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                🛡️ Código de Defesa do Consumidor
              </span>
              <span style={{ fontSize: "12px", background: "var(--surface-elevated)", padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                📜 Código Civil Brasileiro
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", marginBottom: "16px" }}>
                <Cpu size={20} />
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px" }}>
                Motor Groq de Baixa Latência
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14.5px", lineHeight: 1.6 }}>
                Geração em streaming ultra veloz com até 8.192 tokens de saída, gerando peças longas e exaustivas sem truncamento.
              </p>
            </div>
            <div style={{ marginTop: "20px", fontSize: "12px", color: "#10b981", fontWeight: 600 }}>
              ⚡ Tempo médio: ~2.8s
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "32px",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", marginBottom: "16px" }}>
              <FileCode2 size={20} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px" }}>
              Edição com IA Cirúrgica
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14.5px", lineHeight: 1.6 }}>
              Dite ou digite qualquer ajuste na barra flutuante (&quot;mude o valor para R$ 10.000&quot; ou &quot;adicione dano moral&quot;) e veja os parágrafos se atualizarem com destaque visual de diff.
            </p>
          </div>

          {/* Card 4 */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "32px",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", marginBottom: "16px" }}>
              <FileText size={20} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px" }}>
              Exportação Word (.docx)
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14.5px", lineHeight: 1.6 }}>
              Gere o documento final em formato Microsoft Word perfeitamente estruturado, pronto para revisão final e protocolo direto nos tribunais (PJe, e-SAJ, Projudi).
            </p>
          </div>

          {/* Card 5 */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              padding: "32px",
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "rgba(168, 85, 247, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a855f7", marginBottom: "16px" }}>
              <ShieldCheck size={20} />
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "10px" }}>
              Zero Alucinação de Dados
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14.5px", lineHeight: 1.6 }}>
              Informações não fornecidas recebem marcadores inteligentes como <code>[NOME DO AUTOR]</code> e <code>[CPF]</code>, garantindo total segurança contra invenções acidentais.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS: WORKFLOW SECTION ── */}
      <section
        id="como-funciona"
        style={{
          width: "100%",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "80px 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Fluxo Otimizado
            </span>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700, letterSpacing: "-0.03em", marginTop: "8px" }}>
              Do relato do cliente à petição pronta em 3 etapas.
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: "32px",
            }}
          >
            {[
              {
                step: "01",
                title: "Narre o Caso",
                desc: "Digite ou fale ao microfone os fatos relatados pelo cliente. Não precisa se preocupar com formalismos nessa etapa.",
                icon: <Mic size={22} style={{ color: "#d97706" }} />
              },
              {
                step: "02",
                title: "IA Estrutura a Peça",
                desc: "O motor processual gera o cabeçalho, qualificação, fatos, teses de direito e pedidos em alíneas (a, b, c).",
                icon: <Sparkles size={22} style={{ color: "#d97706" }} />
              },
              {
                step: "03",
                title: "Edite e Exporte",
                desc: "Refine os pontos que desejar diretamente no editor ou peça comandos à IA. Baixe em DOCX com 1 clique.",
                icon: <FileText size={22} style={{ color: "#d97706" }} />
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "28px",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "12px", background: "rgba(217, 119, 6, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: "28px", fontWeight: 900, color: "var(--text-muted)", opacity: 0.3, fontFamily: "monospace" }}>
                    {item.step}
                  </span>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>{item.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION (ACCORDION) ── */}
      <section
        id="faq"
        style={{
          width: "100%",
          maxWidth: "860px",
          margin: "0 auto",
          padding: "80px 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Tire suas dúvidas
          </span>
          <h2 style={{ fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700, letterSpacing: "-0.03em", marginTop: "8px" }}>
            Perguntas Frequentes
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            {
              q: "As petições geradas são compatíveis com os tribunais brasileiros?",
              a: "Sim! Toda a estrutura segue estritamente os requisitos do Art. 319 do CPC (Endereçamento, Qualificação, Fatos, Direito com legislação pertinente, Pedidos em alíneas e Valor da Causa)."
            },
            {
              q: "Posso editar o documento antes de baixar?",
              a: "Sim, o editor é totalmente livre e desbloqueado. Você pode alterar qualquer texto manualmente ou usar a barra de inteligência artificial por áudio e texto para fazer edições cirúrgicas em tempo real."
            },
            {
              q: "O arquivo exportado abre normalmente no Microsoft Word?",
              a: "Sim. A exportação é feita em formato .docx nativo com formatação de parágrafos justificados, espaçamentos adequados e títulos estruturados."
            },
            {
              q: "Como a IA evita inventar dados pessoais do cliente?",
              a: "Nosso sistema é configurado com travas rigorosas contra alucinação de dados. Quando um dado não for fornecido nos fatos (como número de RG ou CPF), a IA insere colchetes [PREENCHER RG] para que você finalize com segurança."
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "20px 24px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "15px", fontWeight: 600 }}>{faq.q}</span>
                <ChevronDown
                  size={18}
                  style={{
                    color: "var(--text-muted)",
                    transform: openFaq === idx ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>
              {openFaq === idx && (
                <p style={{ marginTop: "12px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{
          padding: "32px 20px",
          borderTop: "1px solid var(--border)",
          marginTop: "auto",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          background: "var(--surface)",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1160px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          <div>
            © {new Date().getFullYear()} SmartDoc. Ferramenta de inteligência artificial para advogados.
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <a href="#recursos" style={{ color: "inherit", textDecoration: "none" }}>Recursos</a>
            <a href="#como-funciona" style={{ color: "inherit", textDecoration: "none" }}>Como Funciona</a>
            <a href="#faq" style={{ color: "inherit", textDecoration: "none" }}>Dúvidas</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
