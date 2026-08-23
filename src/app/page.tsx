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
  ChevronDown,
  Scale,
  Download,
  ChevronRight,
  Bot
} from "lucide-react";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  const [isDark, setIsDark] = useState<boolean | null>(null);
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
  }, []);

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
    <main className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* ── Ambient Linear Subtle Grid ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-25 dark:opacity-20"
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
      <div className="pointer-events-none absolute -top-32 left-1/2 z-0 h-[400px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_20%,var(--primary),transparent_70%)] opacity-15 blur-3xl" />

      {/* ── Linear Navigation Bar (Fixed) ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex w-full items-center justify-center border-b border-border/80 bg-background/90 px-4 sm:px-8 py-3 backdrop-blur-xl shadow-xs transition-all">
        <div className="flex w-full max-w-5xl items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 border border-primary/20 text-primary transition-transform group-hover:scale-105">
              <Scale className="size-4" />
            </div>
            <div className="flex items-center text-sm font-bold tracking-tight">
              <span>SMART</span>
              <span className="text-primary font-black ml-0.5">DOC</span>
              <span className="ml-2 rounded border border-border/80 bg-muted/60 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
                2.0
              </span>
            </div>
          </Link>

          {/* Center Links with subtle vertical separators */}
          {!isMobile && (
            <div className="flex items-center text-xs font-medium text-muted-foreground">
              <a href="#como-funciona" className="px-3 py-1 transition-colors hover:text-foreground">
                Como Funciona
              </a>
              <span className="text-border/80 select-none">|</span>
              <a href="#recursos" className="px-3 py-1 transition-colors hover:text-foreground">
                Recursos
              </a>
              <span className="text-border/80 select-none">|</span>
              <a href="#faq" className="px-3 py-1 transition-colors hover:text-foreground">
                FAQ
              </a>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2">
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
              className={cn(buttonVariants({ size: "sm" }), "text-xs font-semibold bg-primary text-primary-foreground h-8 px-3.5 rounded-md shadow-sm hover:opacity-90")}
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 flex w-full flex-col items-center px-4 pt-24 sm:pt-32 pb-12 text-center">
        <div className="flex max-w-3xl flex-col items-center">
          {/* Micro Linear Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-border/80 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-md shadow-xs">
            <span className="flex size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-foreground font-semibold">SmartDoc 2.0</span>
            <span className="text-muted-foreground/40">•</span>
            <span>Inteligência Jurídica</span>
            <ChevronRight className="size-3 text-muted-foreground" />
          </div>

          {/* Main Title Objective & High Contrast */}
          <h1 className="mb-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Gerador de Petições Judiciais <br className="hidden sm:inline" />
            <span className="text-primary font-black">
              Estruturadas com IA
            </span>
          </h1>

          {/* Subtitle Objective */}
          <p className="mb-4 max-w-xl text-xs sm:text-sm leading-relaxed text-muted-foreground font-normal">
            Elabore petições iniciais completas com fundamentação legal, doutrina e jurisprudência prontas para o PJe em segundos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "default" }), "h-10 px-6 text-xs font-bold bg-primary text-primary-foreground rounded-xl shadow-md hover:opacity-90 gap-1.5")}
            >
              <Sparkles className="size-3.5" />
              <span>Gerar Petição Grátis</span>
              <ArrowRight className="size-3.5" />
            </Link>

            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "default" }), "h-10 px-5 text-xs font-semibold border-border/80 rounded-xl bg-card/60 backdrop-blur-md")}
            >
              <span>Acessar Painel</span>
            </Link>
          </div>

          {/* Sub Micro Badges */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Exportação .docx nativa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Ditado por voz</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>Visual Law integrado</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE (Linear-Style Window) ── */}
      <section className="relative z-10 flex w-full justify-center px-4 pb-16">
        <div className="w-full max-w-4xl rounded-2xl border border-border/80 bg-card/60 p-1.5 shadow-2xl backdrop-blur-xl">
          {/* Window Header */}
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-2 bg-muted/30 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="size-2 rounded-full bg-border" />
                <div className="size-2 rounded-full bg-border" />
                <div className="size-2 rounded-full bg-border" />
              </div>
              <span className="ml-2 font-mono text-[10px] text-muted-foreground">
                smartdoc.work/editor — Petição Inicial (Ação Indenizatória)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                ● Pronto para Protocolo
              </Badge>
            </div>
          </div>

          {/* Window Mockup Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-border/60 bg-background/50 rounded-b-xl">
            {/* Left Document Editor Area */}
            <div className="lg:col-span-8 p-6 sm:p-8 font-serif text-xs leading-relaxed text-foreground/90 space-y-3">
              <div className="text-center font-bold font-sans text-[11px] tracking-wider text-muted-foreground border-b border-border/40 pb-2">
                EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ___ª VARA CÍVEL DA COMARCA DE SÃO PAULO/SP
              </div>

              <div className="pt-1 text-justify">
                <span className="font-bold text-foreground">JOÃO DA SILVA</span>, brasileiro, solteiro, portador do CPF sob o nº ***.123.456-**, por intermédio de seu advogado signatário, vem propor a presente:
              </div>

              <div className="text-center font-sans font-bold text-xs sm:text-sm text-primary py-1 tracking-tight">
                AÇÃO DE OBRIGAÇÃO DE FAZER C/C REPARAÇÃO POR DANOS MORAIS E MATERIAIS
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 font-sans text-[11px] text-muted-foreground">
                <div className="font-semibold text-primary flex items-center gap-1 mb-0.5">
                  <Sparkles className="size-3" />
                  <span>Fundamentação Jurídica Estruturada:</span>
                </div>
                Art. 186 e 927 do CC c/c Art. 6º, VI e Art. 14 do CDC. Jurisprudência pacificada do STJ.
              </div>

              <p className="text-justify font-serif text-[11px] leading-relaxed text-muted-foreground">
                Configurada a falha na prestação de serviços e o dever de indenizar, requer-se a citação da ré e a total procedência dos pedidos formulados.
              </p>
            </div>

            {/* Right Live Assistant & Meta Panel */}
            <div className="lg:col-span-4 p-4 bg-muted/10 flex flex-col justify-between space-y-3 font-sans">
              <div className="space-y-2.5">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Engenharia Forense
                </div>

                <div className="rounded-xl border border-border/80 bg-card p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Elaboração:</span>
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">1.8 segundos</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Artigos Mapeados:</span>
                    <span className="font-mono font-semibold text-foreground">7 dispositivos</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Visual Law:</span>
                    <span className="font-mono font-semibold text-foreground">Formatado</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-card p-2.5 space-y-1">
                  <div className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                    <Bot className="size-3 text-primary" />
                    <span>IA Flutuante Cirúrgica</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Selecione trechos no editor para reescrever argumentos e enriquecer teses em tempo real.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60">
                <Link
                  href="/register"
                  className={cn(buttonVariants({ size: "sm" }), "w-full text-xs font-semibold bg-primary text-primary-foreground rounded-lg shadow-xs h-8")}
                >
                  Criar Conta e Usar
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID: RECURSOS (Compact & Linear Style) ── */}
      <section id="recursos" className="relative z-10 flex w-full flex-col items-center px-4 py-14 bg-muted/20 border-y border-border/60">
        <div className="w-full max-w-4xl">
          {/* Section Heading */}
          <div className="mb-6 text-center max-w-xl mx-auto">
            <div className="mb-1 text-xs font-mono font-bold uppercase tracking-widest text-primary">
              Recursos
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Projetado para a rotina forense
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Elimine o trabalho braçal de busca de modelos defasados.
            </p>
          </div>

          {/* Bento Grid Container (Subtle Balanced Spacing) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Bento Card 1: Voz */}
            <Card className="md:col-span-2 border-border/80 bg-card/70 px-4 py-4.5 backdrop-blur-md flex flex-col justify-center">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20 mb-1">
                <Mic className="size-3.5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Ditado por Voz Nativo
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fale os fatos do cliente com naturalidade. O reconhecimento de fala transcreve seus relatos diretamente na sua área de trabalho.
                </p>
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded border border-border/80 bg-muted/40 px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
                    <span className="flex size-1.5 rounded-full bg-emerald-500" />
                    <span>Web Speech API nativa • Zero latência</span>
                  </span>
                </div>
              </div>
            </Card>

            {/* Bento Card 2: Visual Law & DOCX */}
            <Card className="border-border/80 bg-card/70 px-4 py-4.5 backdrop-blur-md flex flex-col justify-center">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20 mb-1">
                <Download className="size-3.5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Exportação Word (.docx)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Baixe a peça formatada nos padrões forenses, com tipografia e margens limpas.
                </p>
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <span>Download em 1 clique</span>
                    <ChevronRight className="size-3" />
                  </span>
                </div>
              </div>
            </Card>

            {/* Bento Card 3: IA Flutuante */}
            <Card className="border-border/80 bg-card/70 px-4 py-4.5 backdrop-blur-md flex flex-col justify-center">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20 mb-1">
                <Zap className="size-3.5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Reescrita Cirúrgica
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Aperfeiçoe qualquer argumento selecionando o parágrafo no editor.
                </p>
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                    <span>Refinamento instantâneo</span>
                    <ChevronRight className="size-3" />
                  </span>
                </div>
              </div>
            </Card>

            {/* Bento Card 4: Segurança e Sigilo */}
            <Card className="md:col-span-2 border-border/80 bg-card/70 px-4 py-4.5 backdrop-blur-md flex flex-col justify-center">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20 mb-1">
                <ShieldCheck className="size-3.5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-foreground tracking-tight">
                  Sigilo Profissional e Privacidade
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Estruturado para respeitar o sigilo das informações e a privacidade do advogado. Seus documentos pertencem exclusivamente a você.
                </p>
                <div className="flex flex-wrap gap-1 font-mono text-[9px] text-muted-foreground">
                  <span className="rounded border border-border bg-muted/40 px-1.5 py-0.2">TLS 1.3</span>
                  <span className="rounded border border-border bg-muted/40 px-1.5 py-0.2">Isolamento de Dados</span>
                  <span className="rounded border border-border bg-muted/40 px-1.5 py-0.2">LGPD</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (Timeline 1-2-3) ── */}
      <section id="como-funciona" className="relative z-10 flex w-full flex-col items-center px-4 py-16">
        <div className="w-full max-w-4xl">
          <div className="mb-6 text-center max-w-xl mx-auto">
            <div className="mb-1 text-xs font-mono font-bold uppercase tracking-widest text-primary">
              Fluxo
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Em 3 passos simples
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="font-mono text-[10px] font-extrabold text-primary mb-2">01 / INGESTÃO</div>
              <h4 className="text-sm font-bold text-foreground">Narre os Fatos</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Descreva os fatos relatados pelo cliente na dashboard usando voz ou texto.
              </p>
            </div>

            <div className="relative rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="font-mono text-[10px] font-extrabold text-primary mb-2">02 / ESTRUTURAÇÃO</div>
              <h4 className="text-sm font-bold text-foreground">Geração da Peça</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                A IA constrói endereçamento, qualificação, fatos, direito e pedidos.
              </p>
            </div>

            <div className="relative rounded-xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="font-mono text-[10px] font-extrabold text-primary mb-2">03 / EXPORTAÇÃO</div>
              <h4 className="text-sm font-bold text-foreground">Revise e Baixe</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Faça ajustes finais e baixe o arquivo .docx pronto para protocolo no PJe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section id="faq" className="relative z-10 flex w-full flex-col items-center px-4 py-16 bg-muted/10 border-t border-border/60">
        <div className="w-full max-w-3xl">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              Perguntas Frequentes
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Dúvidas comuns sobre o funcionamento do SmartDoc.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                q: "A petição gerada já vem pronta para protocolo no PJe?",
                a: "Sim. A peça é redigida com estrutura jurídica completa: endereçamento, qualificação das partes, exposição fática, fundamentação de direito (com indicação legal e jurisprudencial), pedidos detalhados e valor da causa."
              },
              {
                q: "Como funciona a exportação para o Word (.docx)?",
                a: "Com um clique no editor, o SmartDoc gera um documento DOCX nativo perfeitamente formatado, pronto para edição adicional ou impressão e assinatura digital."
              },
              {
                q: "Posso utilizar o recurso de voz em qualquer computador?",
                a: "Sim! O reconhecimento de voz funciona diretamente no navegador através da Web Speech API nos navegadores modernos (Google Chrome, Microsoft Edge, Brave, etc)."
              },
              {
                q: "Existe limite de alterações no documento após a geração?",
                a: "Nenhum. O editor conta com ferramentas de formatação completas e a IA flutuante permite que você refatore qualquer parágrafo quantas vezes quiser."
              }
            ].map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/80 bg-card overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-3.5 text-left font-semibold text-xs sm:text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200", openFaq === i ? "rotate-180 text-primary" : "")} />
                </button>
                {openFaq === i && (
                  <div className="px-3.5 pb-3.5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA (Distinct Background & Border) ── */}
      <section className="relative z-10 flex w-full flex-col items-center px-4 py-20 text-center bg-card/60 border-y border-border/70 backdrop-blur-md">
        <div className="flex max-w-2xl flex-col items-center">
          <div className="mb-2 text-xs font-mono font-bold uppercase tracking-widest text-primary">
            Acelere sua Advocacia
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Comece a gerar petições agora
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            Crie sua conta e acelere a produção jurídica do seu escritório com inteligência forense.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "default" }), "h-10 px-6 text-xs font-bold bg-primary text-primary-foreground rounded-lg shadow-md hover:opacity-90 transition-all")}
            >
              Criar Conta Gratuita
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER (Centralizado e Limpo) ── */}
      <footer className="relative z-10 flex w-full flex-col items-center justify-center border-t border-border/60 px-6 py-6 text-xs text-muted-foreground text-center bg-muted/20">
        <div className="flex items-center gap-2">
          <Scale className="size-3.5 text-primary" />
          <span className="font-semibold text-foreground">SmartDoc</span>
          <span>© {new Date().getFullYear()} — Todos os direitos reservados.</span>
        </div>
      </footer>
    </main>
  );
}
