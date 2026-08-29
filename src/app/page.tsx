"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  ArrowRight,
  Zap,
  ShieldCheck,
  FileText,
  Cpu,
  CheckCircle2,
  ChevronDown,
  Download,
  ChevronRight,
  Bot,
  Bold,
  Italic,
  Underline,
  AlignJustify,
  FileCheck,
  Radio,
  Gavel,
  Menu,
  X
} from "lucide-react";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SmartDocLogo, SmartDocBrand } from "@/components/brand-logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [isDark, setIsDark] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [typedConclusion, setTypedConclusion] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMobileRaw = useIsBreakpoint("max", 768);
  const isMobile = isMobileRaw ?? false;

  useEffect(() => {
    const fullText = "O Autor é correntista e usuário dos serviços de intermediação da Ré. Ocorre que, em 15/01/2025, a Requerida realizou o bloqueio unilateral e injustificado do saldo financeiro de R$ 48.500,00, sem qualquer aviso prévio, inviabilizando suas operações e gerando graves prejuízos materiais e evidente abalo moral.";
    let timeout: NodeJS.Timeout;
    let charIndex = 0;

    const typeLoop = () => {
      if (charIndex <= fullText.length) {
        setTypedConclusion(fullText.slice(0, charIndex));
        charIndex++;
        timeout = setTimeout(typeLoop, 28);
      } else {
        timeout = setTimeout(() => {
          charIndex = 0;
          setTypedConclusion("");
          timeout = setTimeout(typeLoop, 600);
        }, 5000);
      }
    };

    timeout = setTimeout(typeLoop, 900);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    // Se o usuário cair na home com token de recuperação, direciona direto para /reset-password
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes("type=recovery") || search.includes("type=recovery") || search.includes("mode=reset")) {
        router.replace(`/reset-password${hash}`);
        return;
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/reset-password");
      }
    });

    const checkUser = async () => {
      if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      }
    };
    checkUser();

    setIsMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || (!savedTheme && document.documentElement.classList.contains("dark"))) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const toggleTheme = () => {
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
  };

  return (
    <main className="relative flex min-h-screen w-full max-w-[100vw] overflow-x-hidden flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* ── Ambient Grid ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-25 dark:opacity-20 overflow-hidden [transform:translateZ(0)]"
        style={{
          backgroundImage: `
            radial-gradient(circle, var(--grid-color) 1px, transparent 1px),
            linear-gradient(to right, var(--grid-color) 0.5px, transparent 0.5px),
            linear-gradient(to bottom, var(--grid-color) 0.5px, transparent 0.5px)
          `,
          backgroundSize: "32px 32px, 64px 64px, 64px 64px",
        }}
      />

      {/* Top Ambient Glow Orb (Primário Central) */}
      <div className="animate-glow-pulse pointer-events-none absolute -top-32 left-1/2 z-0 h-[400px] w-[90vw] max-w-[900px] -translate-x-1/2 blur-3xl [transform:translateZ(0)]"
        style={{ background: "radial-gradient(ellipse at 50% 20%, color-mix(in srgb, var(--primary) 30%, transparent), transparent 70%)" }}
      />
      {/* Orb Secundário Esquerdo */}
      <div className="animate-glow-pulse delay-300 pointer-events-none absolute top-64 -left-40 z-0 h-[320px] w-[320px] blur-3xl opacity-20"
        style={{ background: "radial-gradient(ellipse, #f59e0b 0%, transparent 70%)" }}
      />
      {/* Orb Secundário Direito */}
      <div className="animate-glow-pulse delay-500 pointer-events-none absolute top-96 -right-40 z-0 h-[280px] w-[280px] blur-3xl opacity-15"
        style={{ background: "radial-gradient(ellipse, #ea580c 0%, transparent 70%)" }}
      />

      {/* ── Linear Navigation Bar (Fixed) ── */}
      <header className="fixed top-0 inset-x-0 z-50 flex w-full items-center justify-center border-b border-border/80 bg-background/90 px-4 sm:px-8 py-3 backdrop-blur-md shadow-xs transition-all [transform:translateZ(0)]">
        <div className="flex w-full max-w-5xl items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center shrink-0 transition-transform hover:opacity-95">
            <SmartDocBrand size="md" badge="2.0" />
          </Link>

          {/* Center Links (Desktop only) */}
          <nav className="hidden md:flex items-center text-xs font-medium text-muted-foreground">
            <a href="#inicio" className="px-3 py-1 transition-colors hover:text-foreground">
              Início
            </a>
            <span className="text-border/80 select-none">|</span>
            <a href="#recursos" className="px-3 py-1 transition-colors hover:text-foreground">
              Recursos
            </a>
            <span className="text-border/80 select-none">|</span>
            <a href="#como-funciona" className="px-3 py-1 transition-colors hover:text-foreground">
              Como Funciona
            </a>
            <span className="text-border/80 select-none">|</span>
            <a href="#faq" className="px-3 py-1 transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>

          {/* Right Actions (Desktop) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="size-8 rounded-md border border-border/60 text-muted-foreground hover:text-foreground"
            >
              {isDark ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </Button>

            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs font-medium text-muted-foreground hover:text-foreground h-8 px-3 rounded-md")}
            >
              Entrar
            </Link>

            <Link
              href="/register"
              className={cn(buttonVariants({ size: "sm" }), "text-xs font-semibold bg-primary text-primary-foreground h-8 px-3.5 rounded-md shadow-sm hover:opacity-90 whitespace-nowrap")}
            >
              Começar Agora
            </Link>
          </div>

          {/* Mobile Right Controls: Theme + Hamburger Drawer */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="size-8 rounded-md border border-border/60 text-muted-foreground hover:text-foreground"
            >
              {isDark ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger render={
                <Button variant="outline" size="icon-xs" className="size-8 rounded-md border-border/70 text-foreground">
                  <Menu className="size-4" />
                </Button>
              } />
              <SheetContent side="right" className="w-[280px] p-6 bg-card/95 border-l border-border flex flex-col justify-between backdrop-blur-xl">
                <div className="space-y-6">
                  {/* Brand inside Drawer */}
                  <SmartDocBrand size="md" />

                  {/* Navigation Links */}
                  <nav className="flex flex-col space-y-3 pt-2">
                    <a
                      href="#inicio"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground py-1 transition-colors"
                    >
                      Início
                    </a>
                    <a
                      href="#recursos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground py-1 transition-colors"
                    >
                      Recursos
                    </a>
                    <a
                      href="#como-funciona"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground py-1 transition-colors"
                    >
                      Como Funciona
                    </a>
                    <a
                      href="#faq"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground py-1 transition-colors"
                    >
                      FAQ
                    </a>
                  </nav>
                </div>

                {/* Bottom Actions inside Drawer */}
                <div className="space-y-2.5 pt-6 border-t border-border/70">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center text-xs font-semibold h-9 rounded-lg border-border")}
                  >
                    Entrar na Conta
                  </Link>

                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(buttonVariants({ size: "sm" }), "w-full justify-center text-xs font-semibold bg-primary text-primary-foreground h-9 rounded-lg shadow-sm hover:opacity-90")}
                  >
                    Começar Agora
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section id="inicio" className="relative z-10 flex w-full flex-col items-center px-4 pt-24 sm:pt-36 pb-12 text-center">
        <div className="flex w-full max-w-4xl flex-col items-center mx-auto">

          {/* Micro Linear Badge — animado */}
          <div className="animate-slide-up opacity-0 [animation-fill-mode:forwards] mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary shadow-xs backdrop-blur-sm">
            <span className="flex size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold">Editor de Texto para Advogados</span>
            <ChevronRight className="size-3" />
          </div>

          {/* Main Title — animado com delay */}
          <h1 className="animate-slide-up opacity-0 [animation-fill-mode:forwards] delay-200 mb-4 text-2xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight text-foreground leading-[1.15] max-w-2xl sm:max-w-3xl mx-auto">
            O Editor de Petições<br className="hidden sm:inline" />
            <span className="text-primary">
              {" "}para a Advocacia Moderna
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up opacity-0 [animation-fill-mode:forwards] delay-300 mb-6 max-w-xl mx-auto text-xs sm:text-sm md:text-[15px] leading-relaxed text-muted-foreground font-normal">
            Estruture peças completas, refine teses jurídicas e formate petições prontas para o protocolo judicial com agilidade, precisão e rigor técnico.
          </p>

          {/* CTA Buttons — animados */}
          <div className="animate-slide-up opacity-0 [animation-fill-mode:forwards] delay-400 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "default" }), "h-11 px-7 text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-lg hover:opacity-90 transition-all gap-2")}
            >
              <span>Experimentar Grátis</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "h-11 px-5 text-sm font-semibold border-border/80 rounded-xl bg-card/80 backdrop-blur hover:bg-card")}
            >
              <span>Acessar Meu Painel</span>
            </Link>
          </div>

          {/* Social Proof Micro Tags */}
          <div className="animate-fade-in opacity-0 [animation-fill-mode:forwards] delay-700 mt-8 flex flex-wrap justify-center gap-5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Estruturação jurídica automatizada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Padrão forense e visual law</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Exportação .docx nativa</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE (Interactive Editor Window) ── */}
      <section className="relative z-10 flex w-full justify-center px-4 pb-16">
        {/* Card com shimmer border animado */}
        <div className="shimmer-card animate-slide-up-slow opacity-0 [animation-fill-mode:forwards] w-full max-w-4xl rounded-2xl border border-border/80 bg-card p-1.5 shadow-2xl">
          {/* Window Header / Browser Chrome */}
          <div className="flex items-center justify-between border-b border-border/70 px-3 sm:px-4 py-2 bg-muted/30 rounded-t-xl overflow-hidden gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex gap-1.5 shrink-0">
                <div className="size-2 rounded-full bg-red-400/60" />
                <div className="size-2 rounded-full bg-amber-400/60" />
                <div className="size-2 rounded-full bg-emerald-400/60" />
              </div>
              <span className="ml-1 sm:ml-2 font-mono text-[9px] sm:text-[10px] text-muted-foreground truncate">
                smartdoc.work/editor — Petição Inicial
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[8px] sm:text-[9px] font-mono text-emerald-600 dark:text-emerald-400 gap-1 px-1.5 py-0.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden xs:inline">Pronto para Protocolo</span>
                <span className="xs:hidden">Pronto</span>
              </Badge>
            </div>
          </div>

          {/* Window Mockup Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border/60 bg-background/60 rounded-b-xl overflow-hidden">
            {/* Left Document Editor Area */}
            <div className="lg:col-span-8 p-4 sm:p-7 [font-family:Cambria,Georgia,serif] text-xs leading-relaxed text-foreground/90 space-y-3 bg-card/40 break-words flex flex-col justify-between">
              <div className="space-y-3">
                <div className="text-justify font-bold font-sans text-[10.5px] sm:text-[11.5px] tracking-wide uppercase text-muted-foreground border-b border-border/40 pb-2 leading-snug">
                  EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA 12ª VARA CÍVEL DO FORO CENTRAL DA COMARCA DE SÃO PAULO/SP
                </div>

                <div className="text-justify text-[11px] sm:text-[11.5px] leading-relaxed">
                  <span className="font-bold text-foreground">JOÃO DA SILVA</span>, brasileiro, solteiro, analista de sistemas, portador do RG nº 12.345.678-9 SSP/SP e inscrito no CPF sob o nº ***.123.456-**, residente e domiciliado na Rua das Flores, nº 100, São Paulo/SP, por intermédio de seu advogado constituído, vem, respeitosamente, perante Vossa Excelência, propor a presente:
                </div>

                <div className="h-2" />

                <div className="text-center font-sans font-bold text-xs sm:text-sm text-primary py-1 tracking-tight">
                  AÇÃO DE OBRIGAÇÃO DE FAZER C/C REPARAÇÃO POR DANOS MORAIS E MATERIAIS COM TUTELA DE URGÊNCIA
                </div>

                <div className="h-2" />

                <div className="text-justify text-[11px] sm:text-[11.5px] leading-relaxed">
                  em face de <span className="font-bold text-foreground">TECH PRIME SOLUÇÕES DIGITAIS S.A.</span>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 12.345.678/0001-90, com sede na Av. Paulista, nº 1500, Bela Vista, São Paulo/SP, CEP 01310-200, pelas razões de fato e de direito a seguir expostas:
                </div>

                {/* Seção DOS FATOS com Typing Script */}
                <div className="pt-2 border-t border-border/40 space-y-1">
                  <div className="font-sans font-bold text-[11px] sm:text-xs text-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <span className="text-primary font-mono font-bold">I.</span> DOS FATOS
                  </div>

                  <p className="text-justify [font-family:Cambria,Georgia,serif] text-[11px] sm:text-[11.5px] leading-relaxed text-foreground/90 min-h-[58px]">
                    {typedConclusion}
                    <span className="inline-block w-1.5 h-3.5 bg-primary ml-0.5 animate-pulse align-middle" />
                  </p>
                </div>
              </div>
            </div>

            {/* Right Live Assistant & Meta Panel */}
            <div className="lg:col-span-4 p-4 bg-muted/10 flex flex-col justify-between space-y-3 font-sans">
              <div className="space-y-3">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Painel de Inteligência
                </div>

                {/* Copilot Assistant Active Card */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                      <Bot className="size-3.5 text-primary" />
                      <span>Copiloto de Redação</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Ativo
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Sugere jurisprudências, estrutura pedidos e refina argumentos técnicos em tempo real.
                  </p>
                </div>

                {/* Mapped Legal Articles */}
                <div className="rounded-xl border border-border/80 bg-card p-2.5 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Dispositivos Mapeados:</span>
                    <span className="font-mono font-bold text-foreground text-[10px]">7 artigos</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-muted/60 text-[9px] font-mono text-muted-foreground border border-border/60">Art. 186 CC</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted/60 text-[9px] font-mono text-muted-foreground border border-border/60">Art. 927 CC</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted/60 text-[9px] font-mono text-muted-foreground border border-border/60">Art. 14 CDC</span>
                    <span className="px-1.5 py-0.5 rounded bg-muted/60 text-[9px] font-mono text-muted-foreground border border-border/60">Súmula 162 STJ</span>
                  </div>
                </div>

                {/* Speed & Formatting stats */}
                <div className="rounded-xl border border-border/80 bg-card p-2.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Elaboração:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">1.8 segundos</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Visual Law:</span>
                    <span className="font-mono font-semibold text-foreground">Formatado</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60">
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: "sm" }), "w-full text-xs font-semibold bg-primary text-primary-foreground rounded-lg shadow-xs h-8")}
                >
                  Começar Agora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID: RECURSOS (Compact & Linear Style) ── */}
      <section id="recursos" className="relative z-10 flex w-full flex-col items-center px-4 py-16 bg-muted/20 border-y border-border/60">
        <div className="w-full max-w-4xl">
          {/* Section Heading */}
          <div className="mb-8 text-center w-full max-w-4xl mx-auto">
            <div className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-primary">
              Tecnologia
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground sm:whitespace-nowrap">
              Ferramentas que advogados precisam
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Cada recurso foi projetado por quem entende a rotina de um escritório de advocacia.
            </p>
          </div>

          {/* Bento Grid Container (Subtle Balanced Spacing) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Bento Card 1: IA Forense & Redação */}
            <Card className="md:col-span-2 border-border/80 bg-card px-4 py-4.5 shadow-sm flex flex-col justify-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                <FileText className="size-3.5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Redação Jurídica Estruturada com IA
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Insira o relato dos fatos para estruturar peças processuais completas. O sistema identifica artigos de lei aplicáveis, mapeia jurisprudências e redige pedidos fundamentados.
                </p>
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1.5 rounded border border-border/80 bg-muted/40 px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                    <span className="flex size-1.5 rounded-full bg-emerald-500" />
                    <span>Inteligência Forense • Mapeamento Legal</span>
                  </span>
                </div>
              </div>
            </Card>

            {/* Bento Card 2: Visual Law & DOCX */}
            <Card className="border-border/80 bg-card px-4 py-4.5 shadow-sm flex flex-col justify-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                <Download className="size-3.5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Exportação Word Forense
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Baixe a peça com tipografia, margens e formatação nos padrões judiciais. Pronta para protocolo.
                </p>
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <span>1 clique para .docx</span>
                    <ChevronRight className="size-3" />
                  </span>
                </div>
              </div>
            </Card>

            {/* Bento Card 3: IA Flutuante */}
            <Card className="border-border/80 bg-card px-4 py-4.5 shadow-sm flex flex-col justify-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                <Zap className="size-3.5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Refinamento Inteligente de Teses
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Selecione qualquer trecho da petição para reescrever, fortalecer argumentos, aprofundar jurisprudências ou ajustar pedidos instantaneamente.
                </p>
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <span>Refinamento instantâneo</span>
                    <ChevronRight className="size-3" />
                  </span>
                </div>
              </div>
            </Card>

            {/* Bento Card 4: Segurança e Sigilo */}
            <Card className="md:col-span-2 border-border/80 bg-card px-4 py-4.5 shadow-sm flex flex-col justify-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="size-3.5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Sigilo Profissional Absoluto
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Seus documentos e dados de clientes são isolados, criptografados e nunca compartilhados. Conformidade total com a LGPD e o dever de sigilo da advocacia.
                </p>
                <div className="flex flex-wrap gap-1 font-mono text-[9px] text-muted-foreground pt-0.5">
                  <span className="rounded border border-border bg-muted/40 px-1.5 py-0.2">TLS 1.3</span>
                  <span className="rounded border border-border bg-muted/40 px-1.5 py-0.2">Isolamento de Dados</span>
                  <span className="rounded border border-border bg-muted/40 px-1.5 py-0.2">LGPD</span>
                  <span className="rounded border border-border bg-muted/40 px-1.5 py-0.2">Art. 7º EOAB</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (Timeline 1-2-3) ── */}
      <section id="como-funciona" className="relative z-10 flex w-full flex-col items-center px-4 py-16">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center w-full max-w-4xl mx-auto">
            <div className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-primary">
              Como Funciona
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground sm:whitespace-nowrap">
              Da narrativa ao protocolo em 3 etapas
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Fluxo simplificado para transformar o relato do caso em petição protocolada.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="font-mono text-[10px] font-extrabold text-primary mb-2">01 / NARRATIVA</div>
              <h4 className="text-sm font-bold text-foreground">Insira o relato do caso</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Cole o histórico dos fatos ou documentos do cliente. O assistente processa a narrativa e identifica teses e artigos aplicáveis.
              </p>
            </div>

            <div className="relative rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="font-mono text-[10px] font-extrabold text-primary mb-2">02 / GERAÇÃO</div>
              <h4 className="text-sm font-bold text-foreground">Estruturação forense completa</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Com base nos fatos, o editor estrutura endereçamento, qualificação das partes, fundamentação jurídica, pedidos e valor da causa.
              </p>
            </div>

            <div className="relative rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="font-mono text-[10px] font-extrabold text-primary mb-2">03 / REFINAMENTO</div>
              <h4 className="text-sm font-bold text-foreground">Refine e protocole</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Ajuste qualquer trecho com o copiloto inteligente. Exporte o .docx formatado nos padrões forenses e protocole no tribunal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section id="faq" className="relative z-10 flex w-full flex-col items-center px-4 py-16 bg-muted/10 border-t border-border/60">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center w-full max-w-4xl mx-auto">
            <div className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-primary">
              FAQ
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground sm:whitespace-nowrap">
              Dúvidas Frequentes
            </h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              O que advogados perguntam antes de começar.
            </p>
          </div>

          <div className="space-y-3 max-w-3xl mx-auto">
            {[
              {
                q: "Como o assistente inteligente auxilia na redação de petições?",
                a: "Você insere os fatos e o sistema estrutura toda a petição com endereçamento, fundamentação legal e pedidos. Você pode solicitar revisões cirúrgicas, expansão de teses ou inclusão de precedentes em tempo real."
              },
              {
                q: "Posso alterar a petição apenas conversando?",
                a: 'Sim. Após a geração da peça, você conversa naturalmente com a IA: "adicione um pedido de dano moral de R$ 15.000" ou "reforce a fundamentação no CDC". A IA localiza o trecho correto e aplica a alteração cirurgicamente.'
              },
              {
                q: "A petição gerada já vem pronta para protocolo nos tribunais?",
                a: "Sim. A peça é gerada com estrutura jurídica completa — endereçamento, qualificação, fatos, fundamentação com artigos e jurisprudência, pedidos detalhados e valor da causa. Você exporta o .docx formatado e protocola em qualquer sistema judicial."
              },
              {
                q: "Meus dados e os de meus clientes estão seguros?",
                a: "Absolutamente. Utilizamos criptografia TLS 1.3, isolamento total de dados por usuário e conformidade com a LGPD. Nenhum dado é compartilhado ou utilizado para treinar modelos. O sigilo profissional do advogado é preservado integralmente."
              }
            ].map((faq, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl border bg-card overflow-hidden transition-all duration-300 ease-out",
                  openFaq === i
                    ? "border-primary/40 shadow-xs bg-card/90"
                    : "border-border/80 hover:border-border"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs sm:text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out",
                      openFaq === i ? "rotate-180 text-primary" : ""
                    )}
                  />
                </button>

                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    openFaq === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                      {faq.a}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA (Distinct Background & Border) ── */}
      <section className="relative z-10 flex w-full flex-col items-center px-4 py-16 sm:py-20 text-center bg-muted/30 border-y border-border/70">
        <div className="flex w-full max-w-4xl flex-col items-center mx-auto">
          <div className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-primary">
            Produtividade Forense
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground sm:whitespace-nowrap">
            Eleve a produtividade de seu escritório
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Descubra como economizar horas de trabalho manual com IA especializada.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "default" }), "h-11 px-7 text-xs sm:text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-md hover:opacity-90 transition-all")}
            >
              Criar Conta Gratuita
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER (Modern & Responsivo) ── */}
      <footer className="relative z-10 w-full border-t border-border/70 bg-card/30 backdrop-blur-md">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-xs text-muted-foreground">
          {/* Brand & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <SmartDocBrand size="sm" showIcon={true} />
            <span className="hidden sm:inline text-border/80 select-none">|</span>
            <span className="text-[11px] sm:text-xs text-muted-foreground/80">
              Tecnologia para a advocacia moderna
            </span>
          </div>

          {/* Links e Copyright integrados */}
          <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-[11px] sm:text-xs font-medium">
            <Link href="/termos-de-uso" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <span className="text-muted-foreground/30 select-none">&bull;</span>
            <Link href="/politica-de-privacidade" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
            <span className="text-muted-foreground/30 select-none">&bull;</span>
            <span className="text-muted-foreground/60 font-mono text-[10.5px]">
              © {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
