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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

      <div className="pointer-events-none fixed -top-24 left-1/2 z-0 h-80 w-[700px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_30%,rgba(217,119,6,0.15),transparent_70%)] blur-3xl" />

      {/* ── Main Container (Card + Showcase) ── */}
      <Card className="relative z-10 grid w-full max-w-4xl grid-cols-1 overflow-hidden border-border/80 p-0 shadow-2xl md:grid-cols-12 rounded-2xl">
        {/* Left Side: Auth Form */}
        <div className="flex flex-col justify-center p-6 sm:p-10 md:col-span-7">
          {/* Logo Header */}
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
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta profissional"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login"
                ? "Acesse suas petições salvas e gerencie seus documentos."
                : "Junte-se a advogados que aceleram a redação com o SmartDoc."}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
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
            {mode === "register" && (
              <>
                {/* Nome Completo */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Dr. Carlos Eduardo da Silva"
                      required={mode === "register"}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Número da OAB */}
                <div className="space-y-1.5">
                  <Label htmlFor="oab">
                    OAB / Estado <span className="font-normal text-muted-foreground">(Opcional)</span>
                  </Label>
                  <div className="relative flex items-center">
                    <Briefcase className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="oab"
                      type="text"
                      value={oab}
                      onChange={(e) => setOab(e.target.value)}
                      placeholder="Ex: OAB/SP 123.456"
                      className="pl-9"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail Profissional *</Label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@escritorio.adv.br"
                  required
                  className="pl-9"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha *</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline"
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
                  className="absolute right-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
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
              className="mt-2 h-11 w-full bg-primary text-primary-foreground hover:opacity-90 font-semibold shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Acessar Plataforma" : "Criar Minha Conta"}</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Terms info */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade de Dados.
          </p>
        </div>

        {/* Right Side: Showcase Testimonial Panel (Desktop Only) */}
        {!isMobile && (
          <div className="relative flex flex-col justify-between border-l border-border bg-muted/40 p-8 md:col-span-5">
            <div>
              <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Scale className="size-3.5" />
                <span>Alta Eficiência Jurídica</span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-foreground leading-snug">
                &ldquo;Reduzimos o tempo de elaboração da petição inicial de 4 horas para menos de 10 minutos com o SmartDoc.&rdquo;
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Com fundamentação jurídica sólida, formatação visual moderna e pedidos detalhados, o SmartDoc se tornou a ferramenta indispensável para escritórios de advocacia que buscam escala e excelência.
              </p>
            </div>

            {/* Lawyer Persona Card */}
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm">
                DM
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Dr. Daniel Martins</div>
                <div className="text-xs text-muted-foreground">Sócio Fundador • Martins & Associados</div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </main>
  );
}
