"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  Scale,
  CheckCircle2,
  Briefcase,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oab, setOab] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isMobileRaw = useIsBreakpoint("max", 900);
  const isMobile = isMobileRaw ?? false;

  useEffect(() => {
    // Verificar se usuário já está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkUser();

    // Check query params if they wanted ?mode=register
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") {
      setMode("register");
    }
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setErrorMessage("Por favor, informe seu nome completo.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("As senhas não coincidem.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setErrorMessage("E-mail ou senha incorretos.");
          } else {
            setErrorMessage(error.message);
          }
          setLoading(false);
          return;
        }

        if (data.user) {
          setSuccessMessage("Login realizado com sucesso! Redirecionando...");
          setTimeout(() => {
            router.push("/dashboard");
            router.refresh();
          }, 800);
        }
      } else {
        // Mode: Register via API com auto-confirmação (sem dupla verificação de e-mail)
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
            name: name.trim(),
            oab: oab.trim(),
          }),
        });

        const regData = await regRes.json();

        if (!regRes.ok || regData.error) {
          setErrorMessage(regData.error || "Falha ao criar conta.");
          setLoading(false);
          return;
        }

        // Login automático imediato
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (loginError) {
          setErrorMessage("Conta criada, mas ocorreu um erro no login automático: " + loginError.message);
          setLoading(false);
          return;
        }

        setSuccessMessage("Conta criada com sucesso! Acessando painel...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMessage("Digite seu e-mail no campo acima para recuperar a senha.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login?mode=reset`,
    });
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Link de recuperação de senha enviado para seu e-mail!");
    }
  };

  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans), sans-serif",
        color: "var(--text-primary)",
        position: "relative",
        overflowX: "hidden",
        padding: isMobile ? "24px 16px" : "40px 24px",
      }}
    >
      {/* ── Ambient Background Glow & Grids ── */}
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

      <div style={{
        position: "fixed",
        top: "-15%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "700px",
        height: "350px",
        background: "radial-gradient(ellipse at 50% 30%, rgba(217, 119, 6, 0.15), transparent 70%)",
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* ── Main Container (Card + Showcase) ── */}
      <div
        style={{
          width: "100%",
          maxWidth: isMobile ? "440px" : "960px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.25), 0 0 0 1px var(--border)",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Left Side: Auth Form */}
        <div
          style={{
            padding: isMobile ? "32px 20px" : "48px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Logo Header */}
          <div style={{ marginBottom: "28px" }}>
            <a
              href="/"
              style={{
                fontSize: 19,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                position: "relative",
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

            <h1
              style={{
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                marginTop: "16px",
                marginBottom: "6px",
              }}
            >
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta profissional"}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5 }}>
              {mode === "login"
                ? "Acesse suas petições salvas e gerencie seus documentos."
                : "Junte-se a advogados que aceleram a redação com o SmartDoc."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: "flex",
              background: "var(--bg)",
              padding: "4px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              marginBottom: "24px",
            }}
          >
            <button
              type="button"
              onClick={() => { setMode("login"); setErrorMessage(""); setSuccessMessage(""); }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: mode === "login" ? "var(--surface)" : "transparent",
                color: mode === "login" ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: mode === "login" ? 600 : 500,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: mode === "login" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s",
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setErrorMessage(""); setSuccessMessage(""); }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                background: mode === "register" ? "var(--surface)" : "transparent",
                color: mode === "register" ? "var(--text-primary)" : "var(--text-muted)",
                fontWeight: mode === "register" ? 600 : 500,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: mode === "register" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s",
              }}
            >
              Criar Conta
            </button>
          </div>

          {/* Error & Success Alerts */}
          {errorMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                color: "#ef4444",
                fontSize: "13px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                color: "#10b981",
                fontSize: "13px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {mode === "register" && (
              <>
                {/* Nome Completo */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Nome Completo *
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <User size={16} style={{ position: "absolute", left: "14px", color: "var(--text-muted)", pointerEvents: "none" }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Carlos Eduardo da Silva"
                      required={mode === "register"}
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 38px",
                        borderRadius: "10px",
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#d97706"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                  </div>
                </div>

                {/* Número da OAB */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                    OAB / Estado <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(Opcional)</span>
                  </label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Briefcase size={16} style={{ position: "absolute", left: "14px", color: "var(--text-muted)", pointerEvents: "none" }} />
                    <input
                      type="text"
                      value={oab}
                      onChange={(e) => setOab(e.target.value)}
                      placeholder="Ex: OAB/SP 123.456"
                      style={{
                        width: "100%",
                        padding: "10px 14px 10px 38px",
                        borderRadius: "10px",
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#d97706"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                E-mail Profissional *
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Mail size={16} style={{ position: "absolute", left: "14px", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@escritorio.adv.br"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 38px",
                    borderRadius: "10px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#d97706"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                  Senha *
                </label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{ fontSize: "12px", color: "#d97706", textDecoration: "none", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock size={16} style={{ position: "absolute", left: "14px", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 38px 10px 38px",
                    borderRadius: "10px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#d97706"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Confirmar Senha *
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Shield size={16} style={{ position: "absolute", left: "14px", color: "var(--text-muted)", pointerEvents: "none" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 38px",
                      borderRadius: "10px",
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      outline: "none",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#d97706"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 14px rgba(217, 119, 6, 0.3)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.filter = "brightness(1.08)")}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.filter = "brightness(1)")}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Acessar Plataforma" : "Criar Minha Conta"}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Terms info */}
          <p
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "11px",
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade de Dados.
          </p>
        </div>

        {/* Right Side: Showcase Testimonial Panel (Desktop Only) */}
        {!isMobile && (
          <div
            style={{
              background: "linear-gradient(145deg, rgba(217, 119, 6, 0.08) 0%, rgba(0, 0, 0, 0.4) 100%)",
              borderLeft: "1px solid var(--border)",
              padding: "48px 40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Ambient subtle glow */}
            <div style={{
              position: "absolute",
              bottom: "-50px",
              right: "-50px",
              width: "250px",
              height: "250px",
              background: "radial-gradient(circle, rgba(217, 119, 6, 0.2), transparent 70%)",
              filter: "blur(50px)",
              pointerEvents: "none",
            }} />

            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "5px 12px",
                  borderRadius: "999px",
                  background: "rgba(217, 119, 6, 0.15)",
                  border: "1px solid rgba(217, 119, 6, 0.3)",
                  color: "#d97706",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: "24px",
                }}
              >
                <Scale size={13} />
                <span>Alta Eficiência Jurídica</span>
              </div>

              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.35,
                  marginBottom: "20px",
                  color: "var(--text-primary)",
                }}
              >
                &ldquo;Reduzimos o tempo de elaboração da petição inicial de 4 horas para menos de 10 minutos com o SmartDoc.&rdquo;
              </h2>

              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
                Com fundamentação jurídica sólida, formatação visual moderna e pedidos detalhados, o SmartDoc se tornou a ferramenta indispensável para escritórios de advocacia que buscam escala e excelência.
              </p>
            </div>

            {/* Lawyer Persona Card */}
            <div
              style={{
                marginTop: "32px",
                padding: "16px 20px",
                borderRadius: "16px",
                background: "var(--surface-elevated)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #d97706, #92400e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "16px",
                  flexShrink: 0,
                }}
              >
                DM
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>Dr. Daniel Martins</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sócio Fundador • Martins & Associados</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
