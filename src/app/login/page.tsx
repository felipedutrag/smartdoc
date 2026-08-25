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
  Loader2,
  ChevronLeft,
  KeyRound
} from "lucide-react";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const m = params.get("mode");
      if (m === "register" || m === "forgot" || m === "reset") return m;
      if (window.location.hash.includes("type=recovery") || window.location.hash.includes("access_token")) {
        return "reset";
      }
    }
    return "login";
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isMobileRaw = useIsBreakpoint("max", 900);
  const isMobile = isMobileRaw ?? false;

  useEffect(() => {
    // Checar query params na URL (?mode=register, ?mode=forgot, ?mode=reset)
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    const isRecoveryHash = typeof window !== "undefined" && window.location.hash.includes("type=recovery");

    if (modeParam === "register" || modeParam === "forgot" || modeParam === "reset") {
      setMode(modeParam);
    } else if (isRecoveryHash) {
      setMode("reset");
    }

    // Verificar se usuário já está logado (apenas se for login padrão)
    const checkUser = async () => {
      const isRecovery = modeParam === "reset" || modeParam === "forgot" || isRecoveryHash || mode === "reset" || mode === "forgot";
      if (isRecovery) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkUser();

    // Ouvinte para evento de recuperação de senha do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // ── MODO 1: RECUPERAÇÃO DE SENHA (FORGOT) ──
    if (mode === "forgot") {
      if (!email.trim()) {
        setErrorMessage("Por favor, informe seu e-mail cadastrado.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Falha ao enviar e-mail de recuperação.");
        }
        setSuccessMessage("Instruções e link de redefinição enviados com sucesso para seu e-mail!");
      } catch (err: any) {
        setErrorMessage(err.message || "Erro ao processar recuperação.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── MODO 2: REDEFINIR SENHA (RESET) ──
    if (mode === "reset") {
      if (!password || !confirmPassword) {
        setErrorMessage("Por favor, preencha a nova senha e a confirmação.");
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
      setLoading(true);
      try {
        const { error } = await supabase.auth.updateUser({
          password: password,
        });
        if (error) {
          throw error;
        }
        setSuccessMessage("Senha alterada com sucesso! Redirecionando para seu painel...");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1200);
      } catch (err: any) {
        setErrorMessage(err.message || "Não foi possível redefinir a senha.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── VALIDAÇÕES DE LOGIN / REGISTRO ──
    if (!email || !password) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (mode === "register") {
      if (!name.trim()) {
        setErrorMessage("Por favor, informe seu nome.");
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
        // Mode: Register via API com auto-confirmação e disparo de boas-vindas via Resend
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
            name: name.trim(),
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
          setErrorMessage("Conta criada! Por favor, faça login com seus dados.");
          setMode("login");
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

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden p-4 sm:p-6 lg:p-10">
      {/* ── Ambient Background Glow & Grids ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle, var(--grid-color) 1.2px, transparent 1.2px),
            linear-gradient(to right, var(--grid-color) 0.8px, transparent 0.8px),
            linear-gradient(to bottom, var(--grid-color) 0.8px, transparent 0.8px)
          `,
          backgroundSize: "36px 36px, 72px 72px, 72px 72px",
        }}
      />

      <div
        className="pointer-events-none fixed -top-24 left-1/2 z-0 h-80 w-[700px] -translate-x-1/2 blur-3xl opacity-50"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, color-mix(in srgb, var(--primary) 25%, transparent), transparent 70%)"
        }}
      />

      {/* ── Main Container (Card + Showcase) ── */}
      <Card className="relative z-10 grid w-full max-w-4xl grid-cols-1 overflow-hidden border-border/80 p-0 shadow-2xl md:grid-cols-12 rounded-2xl">
        {/* Left Side: Auth Form */}
        <div className="flex flex-col justify-center p-6 sm:p-10 md:col-span-7">
          {/* Logo Header */}
          <div className="mb-6">
            <a href="/" className="inline-flex items-center text-xl font-bold tracking-tight">
              <span className="tracking-tight">SMART</span>
              <span className="ml-0.5 text-primary">DOC</span>
              <Badge variant="outline" className="ml-2 border-primary/30 bg-primary/10 text-[10px] font-extrabold text-primary">
                PRO
              </Badge>
            </a>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
              {mode === "login" && "Acesse seu escritório digital"}
              {mode === "register" && "Crie sua conta agora"}
              {mode === "forgot" && "Recuperação de Senha"}
              {mode === "reset" && "Definir Nova Senha"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login" && "Suas petições, assistente de voz e documentos aguardam você."}
              {mode === "register" && "Redija petições em minutos, não em horas."}
              {mode === "forgot" && "Informe seu e-mail para receber o link seguro de redefinição."}
              {mode === "reset" && "Digite sua nova senha de acesso abaixo."}
            </p>
          </div>

          {/* Mode Switcher Tabs (Only for login and register) */}
          {(mode === "login" || mode === "register") && (
            <Tabs
              value={mode}
              onValueChange={(val) => {
                setMode(val as "login" | "register");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="mb-6 w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Back button for forgot/reset */}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4" />
              <span>Voltar para o Login</span>
            </button>
          )}

          {/* Error & Success Alerts */}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs font-medium text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* REGISTER: Nome */}
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome *</Label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required={mode === "register"}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {/* EMAIL (Login, Register, Forgot) */}
            {mode !== "reset" && (
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail *</Label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {/* PASSWORD (Login, Register, Reset) */}
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    {mode === "reset" ? "Nova Senha *" : "Senha *"}
                  </Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="px-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* CONFIRM PASSWORD (Register, Reset) */}
            {(mode === "register" || mode === "reset") && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">
                  {mode === "reset" ? "Confirmar Nova Senha *" : "Confirmar Senha *"}
                </Label>
                <div className="relative flex items-center">
                  <Shield className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full bg-primary text-primary-foreground hover:opacity-90 font-semibold shadow-md cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  {mode === "login" && <span>Acessar Meu Painel</span>}
                  {mode === "register" && <span>Criar Minha Conta</span>}
                  {mode === "forgot" && <span>Enviar Link de Recuperação</span>}
                  {mode === "reset" && <span>Salvar Nova Senha</span>}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Terms info */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos{" "}
            <Link href="/termos-de-uso" className="underline hover:text-foreground">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/politica-de-privacidade" className="underline hover:text-foreground">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>

        {/* Right Side: Showcase Testimonial Panel (Desktop Only) */}
        {!isMobile && (
          <div className="relative flex flex-col justify-between border-l border-border bg-muted/40 p-8 md:col-span-5">
            <div>
              <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Scale className="size-3.5" />
                <span>IA de Redação Forense</span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-foreground leading-snug">
                &ldquo;Ditei a narrativa do caso e a IA estruturou a petição completa com teses, artigos e pedidos nos padrões do tribunal. Economizo horas todos os dias.&rdquo;
              </h2>
            </div>

            {/* Lawyer Persona Card */}
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
                MC
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Dra. Marina Cardoso</div>
                <div className="text-xs text-muted-foreground">Sócia • Cardoso &amp; Vasconcelos Advogados</div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
