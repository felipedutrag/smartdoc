"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { Lock, Shield, Eye, EyeOff, Scale, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    async function initSession() {
      try {
        // Se houver hash fragment do Supabase (#access_token=...&type=recovery), o client supabase detecta
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasValidSession(true);
        } else {
          // Verifica se o evento de PASSWORD_RECOVERY dispara
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (event === "PASSWORD_RECOVERY" || currentSession) {
              setHasValidSession(true);
            }
          });
          setTimeout(() => {
            setCheckingSession(false);
          }, 1000);
          return () => subscription.unsubscribe();
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setCheckingSession(false);
      }
    }

    initSession();
  }, [supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

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
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || "Não foi possível redefinir a senha. O link pode ter expirado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-x-hidden p-4 sm:p-6 bg-background text-foreground">
      <div className="relative z-10 w-full max-w-[420px]">
        <Card className="rounded-2xl border border-border/80 bg-card/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <a href="/" className="group flex items-center gap-2 transition-transform hover:scale-105">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/25 text-primary shadow-xs">
                <Scale className="size-4.5" />
              </div>
              <div className="flex items-center text-xl font-bold tracking-tight text-foreground">
                <span>SMART</span>
                <span className="text-primary font-black ml-0.5">DOC</span>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-mono font-bold">
                PRO
              </Badge>
            </a>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
              Definir Nova Senha
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Digite sua nova senha de acesso abaixo.
            </p>
          </div>

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

          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nova Senha *</Label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="newPassword"
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

            <div className="space-y-1.5">
              <Label htmlFor="confirmNewPassword">Confirmar Nova Senha *</Label>
              <div className="relative flex items-center">
                <Shield className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirmNewPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full bg-primary text-primary-foreground font-semibold shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  <span>Salvando nova senha...</span>
                </>
              ) : (
                <span>Salvar Nova Senha</span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <a href="/login" className="text-primary hover:underline font-semibold">
              &larr; Voltar para a tela de Login
            </a>
          </div>
        </Card>
      </div>
    </main>
  );
}
