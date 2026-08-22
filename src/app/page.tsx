"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, ArrowRight, Sparkles, Clock, Send } from "lucide-react";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";

export default function Home() {
  const [isDark, setIsDark] = useState<boolean | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

      rec.onstart = () => {
        setIsDictating(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTextInput(prev => prev ? prev + " " + resultText : resultText);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== "no-speech") {
          setIsDictating(false);
        }
      };

      rec.onend = () => {
        setIsDictating(false);
      };

      setRecognition(rec);
    }
  }, []);

  // Removido useEffect que causava re-render automático do tema para evitar FOUC

  const toggleDictation = () => {
    if (!recognition) {
      alert("Reconhecimento de fala não suportado neste navegador. Tente usar o Google Chrome ou Edge.");
      return;
    }
    if (isDictating) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleGenerate = () => {
    if (!textInput.trim() || redirecting) return;
    setRedirecting(true);

    if (typeof window !== "undefined") {
      localStorage.setItem("extrajus_facts", textInput);
      localStorage.removeItem("extrajus_payment_status");
      window.location.href = "/editor?generate=true";
    }
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
      {/* ── Background Effects ── */}
      {/* Premium Tech Grid & Dot Grid Blend */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `
          radial-gradient(circle, var(--grid-color) 1.2px, transparent 1.2px),
          linear-gradient(to right, var(--grid-color) 0.8px, transparent 0.8px),
          linear-gradient(to bottom, var(--grid-color) 0.8px, transparent 0.8px)
        `,
        backgroundSize: "32px 32px, 64px 64px, 64px 64px",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.35,
      }} />

      {/* Floating Ambient Aura Blobs */}
      <div style={{
        position: "fixed",
        top: "-15%",
        left: "5%",
        width: "60vw",
        height: "60vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(217, 119, 6, 0.04) 0%, transparent 70%)",
        filter: "blur(90px)",
        pointerEvents: "none",
        zIndex: 0,
        animation: "aura-movement-1 25s infinite alternate ease-in-out"
      }} />
      <div style={{
        position: "fixed",
        bottom: "-15%",
        right: "-10%",
        width: "55vw",
        height: "55vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(251, 191, 36, 0.025) 0%, transparent 70%)",
        filter: "blur(100px)",
        pointerEvents: "none",
        zIndex: 0,
        animation: "aura-movement-2 30s infinite alternate ease-in-out"
      }} />
      <div style={{
        position: "fixed",
        top: "25%",
        right: "10%",
        width: "45vw",
        height: "45vw",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(217, 119, 6, 0.02) 0%, transparent 70%)",
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 0,
        animation: "aura-movement-3 22s infinite alternate ease-in-out"
      }} />

      {/* ── Header ── */}
      <div
        className="header-wrapper"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 20px 4px",
          zIndex: 50,
          position: "sticky",
          top: 0,
          width: "100%",
        }}
      >
        <div
          className="header-pill"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px", /* Slimmer vertical height for a tighter layout */
            width: "100%",
            maxWidth: "1200px",
            background: "var(--header-pill-bg)",
            backdropFilter: "blur(12px)",
            borderRadius: "16px",
            border: "var(--header-pill-border)",
            boxShadow: "var(--header-pill-shadow)",
          }}
        >
          {/* Logo */}
          <span
            style={{
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              cursor: "default",
              position: "relative",
              fontFamily: "var(--font-sans), sans-serif",
            }}
          >
            <span style={{ fontWeight: 500, letterSpacing: "-0.05em" }}>SMART</span>
            <span style={{ fontWeight: 900, color: "#d97706", letterSpacing: "-0.05em", marginLeft: 2 }}>DOC</span>
            <span
              style={{
                position: "absolute",
                top: -6,
                right: -22,
                background: "rgba(217, 119, 6, 0.12)",
                border: "1px solid rgba(217, 119, 6, 0.25)",
                color: "#d97706",
                fontSize: 8,
                fontWeight: 900,
                padding: "1px 5px",
                borderRadius: "4px",
              }}>
              IA
            </span>
          </span>

          {/* Right Area: Status Badge + Theme Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isMounted && !isMobile && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                borderRadius: "99px",
                background: "var(--badge-bg)",
                border: "1px solid var(--badge-border)",
                fontSize: "11px",
                color: "var(--text-secondary)",
                fontWeight: 600,
                letterSpacing: "0.02em",
                cursor: "default"
              }}>
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                  display: "inline-block"
                }} />
                <span>SISTEMA ONLINE</span>
              </div>
            )}

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
              aria-label="Toggle theme"
              style={{
                width: 36,
                height: 36,
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
              <div className="theme-icon-light">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </div>
              <div className="theme-icon-dark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="home-main-content" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>

        <div style={{ maxWidth: "800px", width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1
            className="hero-title"
            style={{
              fontSize: "clamp(32px, 5vw + 12px, 52px)",
              fontWeight: 500,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              background: "var(--hero-title-bg)",
              WebkitBackgroundClip: "var(--hero-title-clip)",
              WebkitTextFillColor: "var(--hero-title-color)",
              color: "var(--hero-title-color)",
              marginBottom: "clamp(12px, 3vw, 24px)"
            }}
          >
            A Notificação Extrajudicial{" "}
            <br />
            <strong style={{ fontWeight: 800 }}>que resolve de verdade.</strong>
          </h1>
          <p
            className="hero-subtitle"
            style={{
              fontSize: "clamp(16px, 2.5vw, 20px)",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: "clamp(16px, 3vw, 24px)",
              maxWidth: "700px"
            }}
          >
            Gere notificações com fundamentação jurídica{" "}
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {" "}altamente qualificada e personalizada em poucos minutos.
            </span>{" "}
            Rápido, inteligente e eficiente.
          </p>

          <style>{`
            /* Default: show subtle static gradient border */
            .textarea-wrapper .accelerator-effect {
              opacity: 1 !important;
            }
            .home-textarea::placeholder {
              color: var(--text-muted) !important;
              opacity: 0.85 !important;
            }
          `}</style>
          <div
            className="textarea-wrapper"
            style={{
              width: "100%",
              borderRadius: "24px",
              padding: "1px",
              overflow: "hidden",
              position: "relative",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "var(--textarea-shadow, none)"
            }}
          >
            {/* Static gradient border background (visible when not focused) */}
            <div
              className="accelerator-effect"
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(135deg, rgba(217, 119, 6, 0.3) 0%, rgba(217, 119, 6, 0.08) 100%)",
                zIndex: 0,
                transition: "opacity 0.4s ease",
              }}
            />

            {/* Inner Content Container */}
            <div
              className="textarea-inner"
              style={{
                width: "100%",
                background: "var(--textarea-wrapper-bg)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderRadius: "23px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                zIndex: 1,
                border: "none"
              }}>

              {/* Chips slider with arrows */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0",
                padding: "12px 2px",
                background: "var(--chips-track-bg)",
                borderBottom: "1px solid var(--chips-track-border)",
                flexShrink: 0,
                position: "relative",
                zIndex: 1
              }}>
                <style>{`
                .chips-track::-webkit-scrollbar { display: none; }
              `}</style>
                {/* Left arrow */}
                <button
                  onClick={() => {
                    const el = document.getElementById("chips-track");
                    if (el) el.scrollBy({ left: -200, behavior: "smooth" });
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: 0.5,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {/* Track */}
                <div
                  id="chips-track"
                  className="chips-track"
                  style={{
                    display: "flex",
                    gap: "8px",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    flex: 1,
                    padding: "0 4px",
                  }}
                >
                  {[
                    { label: "Aluguel atrasado", text: "Meu inquilino está com o aluguel atrasado há 3 meses e não responde minhas mensagens. Quero notificá-lo para pagar os valores devidos ou desocupar o imóvel em 15 dias." },
                    { label: "Vizinho barulhento", text: "Meu vizinho faz festas e barulho excessivo durante a madrugada, todos os fins de semana, descumprindo as regras do condomínio. Já reclamei várias vezes e nada mudou." },
                    { label: "Produto com defeito", text: "Comprei um produto que veio com defeito e a loja se recusa a trocar ou devolver o dinheiro. Já entrei em contato diversas vezes sem solução." },
                    { label: "Serviço não prestado", text: "Contratei e paguei por um serviço que nunca foi realizado. O prestador não responde e se recusa a devolver o valor pago." },
                    { label: "Dívida não paga", text: "Emprestei dinheiro a uma pessoa que se comprometeu a devolver em uma data específica, mas não pagou e agora ignora meus contatos." },
                    { label: "Rescisão contratual", text: "A outra parte descumpriu cláusulas importantes do contrato que assinamos. Quero notificá-la formalmente sobre o descumprimento e exigir a resolução ou rescisão." },
                    { label: "Vazamento / Infiltração", text: "Há uma infiltração vinda do apartamento superior que está danificando o teto do meu banheiro. O proprietário do imóvel de cima ignora minhas tentativas de contato para resolver a reforma." },
                    { label: "Cobrança indevida", text: "Recebi uma cobrança indevida em meu nome por um serviço de assinatura que cancelei há meses. Exijo a exclusão do débito e a retirada do meu nome dos órgãos de proteção ao crédito." },
                    { label: "Atraso na entrega", text: "Comprei móveis planejados com entrega prometida para 30 dias úteis, mas o prazo já venceu há mais de um mês e a empresa não me dá uma resposta concreta sobre a data de entrega." },
                    { label: "Desocupação de imóvel", text: "Quero notificar formalmente meu locador de que irei desocupar o imóvel alugado no prazo de 30 dias, conforme prevê a Lei do Inquilinato, para evitar multas de aviso prévio." },
                    { label: "Despesas de muro / cerca", text: "Preciso construir ou reparar o muro divisório entre o meu terreno e o do vizinho. Quero notificá-lo para compartilharmos as despesas da obra, como prevê o Código Civil." },
                    { label: "Carro com defeito", text: "Comprei um carro usado e, após duas semanas, o motor apresentou um defeito grave preexistente (vício oculto) que a concessionária se recusa a cobrir na garantia legal de 90 dias." },
                    { label: "Quebra de sigilo (NDA)", text: "Uma empresa parceira violou o acordo de confidencialidade (NDA) que assinamos, compartilhando informações estratégicas do meu projeto com terceiros sem minha autorização." },
                    { label: "Uso indevido de marca", text: "Identifiquei que outra empresa está utilizando comercialmente uma marca registrada de minha propriedade no mesmo segmento de atuação, gerando confusão nos clientes." },
                    { label: "Reembolso de curso", text: "Comprei um curso online e solicitei o cancelamento e reembolso dentro do prazo de 7 dias previsto no Código de Defesa do Consumidor, mas o suporte ignora minhas mensagens." },
                    { label: "Atraso na entrega de chaves", text: "A construtora atrasou a entrega das chaves do meu apartamento além do prazo de tolerância de 180 dias previsto no contrato. Exijo esclarecimentos e indenização." },
                    { label: "Perturbação do sossego", text: "Estou notificando o síndico e o condomínio sobre as constantes perturbações do sossego no prédio causadas por barulhos fora do horário permitido, exigindo providências." },
                    { label: "Aviso de fiador", text: "O inquilino principal do contrato de locação do qual sou fiador não pagou o aluguel. Quero notificar o proprietário exigindo informações detalhadas antes de qualquer ação judicial." },
                    { label: "Uso indevido de imagem", text: "Uma marca está utilizando fotos e vídeos do meu perfil pessoal em campanhas publicitárias nas redes sociais sem qualquer contrato de licença ou autorização de imagem." },
                    { label: "Retenção de documento", text: "A instituição está retendo meus documentos originais ou histórico escolar, o que é proibido por lei, impedindo minha matrícula em outro local." },
                    { label: "Invasão de limites", text: "O proprietário do terreno vizinho avançou a cerca sobre o meu limite de propriedade. Exijo que ele reposicione a demarcação para o limite correto imediatamente." },
                    { label: "Reembolso de voo", text: "Meu voo foi cancelado pela companhia aérea e a empresa se recusa a fazer o reembolso integral em dinheiro do valor da passagem, oferecendo apenas créditos expiráveis." },
                    { label: "Reajuste de plano de saúde", text: "Meu plano de saúde aplicou um reajuste de mensalidade abusivo por mudança de faixa etária que descumpre as regras da ANS e o Estatuto da Pessoa Idosa." },
                    { label: "Dano em estacionamento", text: "Deixei meu carro em um estacionamento pago e, ao retirar, notei um risco profundo na lateral. A empresa se recusa a assumir a responsabilidade pelo dano causado." },
                    { label: "Internet interrompida", text: "Meu serviço de internet foi interrompido por mais de 48 horas seguidas sem qualquer aviso prévio ou desconto proporcional na fatura mensal." },
                    { label: "LGPD / Remoção de dados", text: "Quero notificar um site ou provedor para remover imediatamente informações difamatórias ou vazamento de dados pessoais de minha titularidade, em conformidade com a LGPD." },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => setTextInput(chip.text)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: "var(--chip-bg)",
                        border: "1px solid var(--chip-border)",
                        color: "var(--text-muted)",
                        fontSize: "11px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--chip-hover-bg)";
                        e.currentTarget.style.borderColor = "var(--chip-hover-border)";
                        e.currentTarget.style.color = "var(--chip-hover-color)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--chip-bg)";
                        e.currentTarget.style.borderColor = "var(--chip-border)";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Right arrow */}
                <button
                  onClick={() => {
                    const el = document.getElementById("chips-track");
                    if (el) el.scrollBy({ left: 200, behavior: "smooth" });
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: 0.5,
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <textarea
                className="home-textarea"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isMounted && isMobile ? "Descreva o caso/ocorrido..." : "Digite seu problema e como desejaria de resolver..."}
                style={{
                  width: "100%",
                  minHeight: isMounted && isMobile ? "130px" : "185px",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  padding: isMounted && isMobile ? "16px 16px 12px" : "24px clamp(16px, 3vw, 24px) 16px",
                  fontSize: isMounted && isMobile ? "14.5px" : "clamp(14px, 2vw, 16px)",
                  color: "var(--text-primary)",
                  lineHeight: 1.6,
                  position: "relative",
                  zIndex: 1,
                  transition: "min-height 0.2s ease, padding 0.2s ease"
                }}
              />

              {/* Action Bar */}
              <div
                className="textarea-action-bar"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "clamp(10px, 1.5vw, 12px)",
                  borderTop: "1px solid var(--border)",
                  background: "var(--action-bar-bg)",
                  position: "relative",
                  zIndex: 1
                }}>
                <button
                  className="btn-dictate"
                  onClick={toggleDictation}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "clamp(8px, 1vw, 10px) clamp(12px, 1.5vw, 16px)",
                    borderRadius: "99px",
                    background: isDictating ? "rgba(239, 68, 68, 0.1)" : "transparent",
                    color: isDictating ? "#ef4444" : "var(--text-secondary)",
                    border: isDictating ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid transparent",
                    cursor: "pointer",
                    fontSize: "clamp(13px, 1.5vw, 14px)",
                    fontWeight: 500,
                    transition: "all 0.2s"
                  }}
                >
                  {isDictating ? (
                    <>
                      <Mic size={16} />
                      <span>Ouvindo...</span>
                    </>
                  ) : (
                    <>
                      <Mic size={16} />
                      <span style={{ display: "flex", gap: "4px" }}>
                        Ditar<span className="desktop-only-flex"> por voz</span>
                      </span>
                    </>
                  )}
                </button>

                <button
                  className="btn-generate"
                  onClick={handleGenerate}
                  disabled={!textInput.trim() || redirecting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "12px 28px",
                    borderRadius: "12px",
                    background: !textInput.trim() || redirecting
                      ? "var(--surface-elevated)"
                      : "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                    color: !textInput.trim() || redirecting ? "var(--text-muted)" : "#ffffff",
                    border: "none",
                    cursor: !textInput.trim() || redirecting ? "not-allowed" : "pointer",
                    fontSize: "clamp(14px, 1.5vw, 15px)",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                    textShadow: "none",
                    boxShadow: !textInput.trim() || redirecting ? "none" : "0 4px 12px rgba(217, 119, 6, 0.15)",
                    transition: "all 0.2s ease",
                    transform: "translateY(0)"
                  }}
                  onMouseEnter={(e) => {
                    if (textInput.trim() && !redirecting) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(217, 119, 6, 0.25)";
                      e.currentTarget.style.filter = "brightness(1.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (textInput.trim() && !redirecting) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(217, 119, 6, 0.15)";
                      e.currentTarget.style.filter = "brightness(1)";
                    }
                  }}
                  onMouseDown={(e) => {
                    if (textInput.trim() && !redirecting) {
                      e.currentTarget.style.transform = "translateY(1px)";
                      e.currentTarget.style.boxShadow = "0 2px 6px rgba(217, 119, 6, 0.1)";
                    }
                  }}
                  onMouseUp={(e) => {
                    if (textInput.trim() && !redirecting) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(217, 119, 6, 0.25)";
                    }
                  }}
                >
                  {redirecting ? (
                    <span>Gerando...</span>
                  ) : (
                    <>
                      <span>Gerar Notificação</span>
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </div> {/* Inner Container Closing */}
          </div> {/* Wrapper Closing */}
          {/* Elegant Features Badges */}
          <div
            className="features-badges-container"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "12px",
              width: "100%",
              marginTop: "24px"
            }}>
            {[
              { icon: <Sparkles size={14} style={{ color: "#d97706" }} />, text: "Edite com IA" },
              { icon: <Clock size={14} style={{ color: "#d97706" }} />, text: "Entrega Imediata" },
              { icon: <Send size={14} style={{ color: "#d97706" }} />, text: "Envio Digital" }
            ].map((badge, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "99px",
                  background: "var(--badge-bg)",
                  border: "1px solid var(--badge-border)",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: 500
                }}
              >
                {badge.icon}
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <footer
        style={{
          padding: "32px 20px",
          borderTop: "1px solid var(--border)",
          marginTop: "auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          background: "rgba(0, 0, 0, 0.01)",
          position: "relative",
          zIndex: 10
        }}
      >
        {/* Disclaimer and Copyright */}
        <div style={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          textAlign: "center",
          fontSize: "11px",
          color: "var(--text-muted)",
          lineHeight: "1.6"
        }}>
          <p>© {new Date().getFullYear()} SmartDoc. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
