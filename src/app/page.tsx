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
  Scale,
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
import { SmartDocLogo } from "@/components/brand-logo";
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
    const fullText = "Configurada a manifesta falha na prestação dos serviços e o dever de indenizar nos termos do art. 14 do CDC, requer-se a total procedência dos pedidos com a condenação da ré ao pagamento de reparação por danos morais e materiais.";
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
      {/* ── Ambient Linear Subtle Grid ── */}
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

      {/* Top Ambient Glow Orb */}
      <div className="pointer-events-none absolute -top-32 left-1/2 z-0 h-[300px] sm:h-[400px] w-[90vw] max-w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_20%,var(--primary),transparent_70%)] opacity-15 blur-3xl [transform:translateZ(0)]" />

      {/* ── Linear Navigation Bar (Fixed) ── */}
      <header className="fixed top-0 inset-x-0 z-50 flex w-full items-center justify-center border-b border-border/80 bg-background/90 px-4 sm:px-8 py-3 backdrop-blur-md shadow-xs transition-all [transform:translateZ(0)]">
        <div className="flex w-full max-w-5xl items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-2 shrink-0">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary transition-transform group-hover:scale-105">
              <SmartDocLogo className="size-4" />
            </div>
            <div className="flex items-center text-sm font-bold tracking-tight">
              <span>SMART</span>
              <span className="text-primary font-black ml-0.5">DOC</span>
              <span className="ml-2 rounded border border-border/80 bg-muted/60 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                2.0
              </span>
            </div>
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
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary">
                      <Scale className="size-4" />
                    </div>
                    <div className="flex items-center text-sm font-bold tracking-tight text-foreground">
                      <span>SMART</span>
                      <span className="text-primary font-black ml-0.5">DOC</span>
                      <span className="ml-2 rounded border border-border/80 bg-muted/60 px-1.5 py-0.2 font-mono text-[8px] font-semibold text-muted-foreground uppercase">
                        2.0
                      </span>
                    </div>
                  </div>

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
      <section id="inicio" className="relative z-10 flex w-full flex-col items-center px-4 pt-24 sm:pt-32 pb-12 text-center">
        <div className="flex w-full max-w-4xl flex-col items-center mx-auto">
          {/* Micro Linear Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-border/80 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="flex size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-foreground font-semibold">SmartDoc 2.0</span>
            <span className="text-muted-foreground/40">•</span>
            <span>IA de Voz Jurídica</span>
            <ChevronRight className="size-3 text-muted-foreground" />
          </div>

          {/* Main Title Objective & High Contrast */}
          <h1 className="mb-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] max-w-4xl mx-auto">
            Sua Assistente Jurídica <br className="hidden sm:inline" />
            <span className="text-primary font-black">
              com IA de Voz
            </span>
          </h1>

          {/* Subtitle Objective */}
          <p className="mb-6 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-muted-foreground font-normal">
            Converse naturalmente com a IA para redigir, alterar e aperfeiçoar petições inteiras — por voz ou texto. Pronta para protocolo judicial em minutos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "default" }), "h-11 px-6 text-xs sm:text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-md hover:opacity-90 gap-1.5")}
            >
              <span>Experimentar</span>
              <ArrowRight className="size-3.5" />
            </Link>

            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "h-11 px-5 text-xs sm:text-sm font-semibold border-border/80 rounded-xl bg-card")}
            >
              <span>Acessar Meu Painel</span>
            </Link>
          </div>

          {/* Sub Micro Badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Assistente de voz com IA generativa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Alteração por conversa natural</span>
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
        <div className="w-full max-w-4xl rounded-2xl border border-border/80 bg-card p-1.5 shadow-2xl">
          {/* Window Header / Browser Chrome */}
          <div className="flex items-center justify-between border-b border-border/70 px-3 sm:px-4 py-2 bg-muted/30 rounded-t-xl overflow-hidden gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex gap-1.5 shrink-0">
                <div className="size-2 rounded-full bg-border" />
                <div className="size-2 rounded-full bg-border" />
                <div className="size-2 rounded-full bg-border" />
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

          {/* Sub Editor Toolbar */}
          <div className="flex items-center justify-between border-b border-border/60 px-3 sm:px-4 py-1.5 bg-muted/15 text-muted-foreground text-xs overflow-hidden gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 border-r border-border/60 pr-2">
                <span className="font-semibold text-foreground text-[10px] sm:text-[11px]">Padrão Forense</span>
                <span className="text-[9px] sm:text-[10px] font-mono opacity-60">12pt</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground/70">
                <span className="px-1 py-0.5 rounded font-bold hover:bg-muted text-[10px]">B</span>
                <span className="px-1 py-0.5 rounded italic hover:bg-muted text-[10px]">I</span>
                <span className="px-1 py-0.5 rounded underline hover:bg-muted text-[10px]">U</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono text-primary font-medium">
                <span className="size-1.5 rounded-full bg-primary animate-ping" />
                <span>IA ao Vivo</span>
              </span>
            </div>
          </div>

          {/* Window Mockup Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border/60 bg-background/60 rounded-b-xl overflow-hidden">
            {/* Left Document Editor Area */}
            <div className="lg:col-span-8 p-4 sm:p-8 font-serif text-xs leading-relaxed text-foreground/90 space-y-3.5 bg-card/40 break-words">
              <div className="text-center font-bold font-sans text-[11px] tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA 12ª VARA CÍVEL DA COMARCA DE SÃO PAULO/SP
              </div>

              <div className="pt-1 text-justify">
                <span className="font-bold text-foreground">JOÃO DA SILVA</span>, brasileiro, solteiro, portador do CPF sob o nº ***.123.456-**, por intermédio de seu advogado signatário, vem propor a presente:
              </div>

              <div className="text-center font-sans font-bold text-xs sm:text-sm text-primary py-1 tracking-tight">
                AÇÃO DE OBRIGAÇÃO DE FAZER C/C REPARAÇÃO POR DANOS MORAIS E MATERIAIS
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 font-sans text-[11px] text-muted-foreground space-y-1">
                <div className="font-semibold text-primary flex items-center gap-1.5">
                  <Scale className="size-3.5" />
                  <span>Fundamentação Jurídica Estruturada:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Art. 186 e 927 do CC c/c Art. 6º, VI e Art. 14 do CDC. Jurisprudência pacificada do STJ (Súmula 162).
                </p>
              </div>

              {/* Dynamic Typewriter Paragraph */}
              <div className="pt-1">
                <p className="text-justify font-serif text-[11px] leading-relaxed text-foreground/90 min-h-[46px]">
                  {typedConclusion}
                  <span className="inline-block w-1.5 h-3 bg-primary ml-0.5 animate-pulse align-middle" />
                </p>
              </div>
            </div>

            {/* Right Live Assistant & Meta Panel */}
            <div className="lg:col-span-4 p-4 bg-muted/10 flex flex-col justify-between space-y-3 font-sans">
              <div className="space-y-3">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Painel de Inteligência
                </div>

                {/* Voice Assistant Active Card */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                      <Mic className="size-3.5 text-primary animate-pulse" />
                      <span>Assistente de Voz Ativo</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Ao Vivo
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Converse com a IA para reescrever argumentos, adicionar pedidos ou alterar teses — tudo por voz.
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
            {/* Bento Card 1: Voz & IA Forense */}
            <Card className="md:col-span-2 border-border/80 bg-card px-4 py-4.5 shadow-sm flex flex-col justify-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                <Mic className="size-3.5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Assistente de Voz e Redação com IA
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dite a narrativa do caso ou converse com a IA para estruturar peças completas. Ela identifica artigos de lei aplicáveis, organiza os fatos e redige os pedidos em tempo real.
                </p>
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1.5 rounded border border-border/80 bg-muted/40 px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                    <span className="flex size-1.5 rounded-full bg-emerald-500" />
                    <span>Inteligência Jurídica • Voz e Texto</span>
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
                  Edição por Voz ou Texto
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Selecione qualquer trecho e peça à IA para reescrever, fortalecer a tese ou adicionar fundamentação. Por voz ou digitando.
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
              <h4 className="text-sm font-bold text-foreground">Relate ou dite o caso</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Cole o histórico dos fatos, mensagens de WhatsApp ou dite a narrativa por voz. A IA processa e identifica teses e dispositivos aplicáveis.
              </p>
            </div>

            <div className="relative rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="font-mono text-[10px] font-extrabold text-primary mb-2">02 / GERAÇÃO</div>
              <h4 className="text-sm font-bold text-foreground">A IA redige a peça completa</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Com base nos fatos, a IA estrutura endereçamento, qualificação, fundamentação jurídica, pedidos e valor da causa.
              </p>
            </div>

            <div className="relative rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="font-mono text-[10px] font-extrabold text-primary mb-2">03 / REFINAMENTO</div>
              <h4 className="text-sm font-bold text-foreground">Refine por voz e protocole</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Converse com a IA para ajustar qualquer trecho. Exporte o .docx formatado e protocole no tribunal.
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
                q: "Como funciona a assistência de voz com a IA?",
                a: "Você pode ditar fatos brutos e conversar diretamente com o assistente inteligente para pedir revisões, novos pedidos ou inclusão de teses doutrinárias e jurisprudenciais — a peça é atualizada instantaneamente na sua tela."
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
      <section className="relative z-10 flex w-full flex-col items-center px-4 py-20 text-center bg-muted/30 border-y border-border/70">
        <div className="flex w-full max-w-4xl flex-col items-center mx-auto">
          <div className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-primary">
            Produtividade Forense
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground sm:whitespace-nowrap">
            Comece a advogar com IA agora
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Crie sua conta e descubra como a IA de voz transforma a rotina do seu escritório.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "default" }), "h-11 px-7 text-xs sm:text-sm font-bold bg-primary text-primary-foreground rounded-xl shadow-md hover:opacity-90 transition-all")}
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER (Centralizado e Limpo) ── */}
      <footer className="relative z-10 flex w-full flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 px-6 py-6 text-xs text-muted-foreground bg-muted/20">
        <div className="flex items-center gap-2">
          <SmartDocLogo className="size-3.5 text-primary" />
          <span className="font-semibold text-foreground">SmartDoc</span>
          <span>© {new Date().getFullYear()} — Tecnologia Jurídica com IA. Todos os direitos reservados.</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link href="/termos-de-uso" className="hover:text-foreground hover:underline transition-colors">
            Termos de Uso
          </Link>
          <span>&bull;</span>
          <Link href="/politica-de-privacidade" className="hover:text-foreground hover:underline transition-colors">
            Política de Privacidade
          </Link>
        </div>
      </footer>
    </main>
  );
}
