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

import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

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

  return (
    <main className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background text-foreground">
      {/* ── Ambient Linear Background Glows & Grids ── */}
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

      {/* Glow Orbs */}
      <div className="pointer-events-none absolute -top-24 left-1/2 z-0 h-96 w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_30%,var(--primary),transparent_70%)] opacity-20 blur-3xl" />

      {/* ── Navigation Bar (Shadcn style) ── */}
      <nav className="sticky top-0 z-50 flex w-full items-center justify-center p-4">
        <div className="flex w-full max-w-6xl items-center justify-between rounded-2xl border border-border bg-background/80 px-6 py-2.5 shadow-sm backdrop-blur-md">
          {/* Logo */}
          <Link href="/" className="relative flex items-center text-lg font-bold tracking-tight">
            <span>SMART</span>
            <span className="ml-0.5 text-primary">DOC</span>
            <Badge variant="outline" className="ml-2 border-primary/30 bg-primary/10 text-[10px] font-extrabold text-primary">
              PRO
            </Badge>
          </Link>

          {/* Center Links (Desktop only) */}
          {!isMobile && (
            <div className="flex items-center gap-7 text-xs font-medium text-muted-foreground">
              <a href="#recursos" className="transition-colors hover:text-foreground">Recursos</a>
              <a href="#como-funciona" className="transition-colors hover:text-foreground">Como Funciona</a>
              <a href="#faq" className="transition-colors hover:text-foreground">Dúvidas</a>
            </div>
          )}

          {/* Right Actions: Theme Toggle & Login */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
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
              className="size-8 rounded-lg"
            >
              {isDark ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </Button>

            <Link
              href="/login"
              className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex bg-primary text-primary-foreground font-semibold shadow-sm")}
            >
              Acessar
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="relative z-10 flex w-full flex-col items-center px-4 py-16 sm:py-24 text-center">
        <div className="flex max-w-3xl flex-col items-center">
          {/* Release Pill Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm">
            <Zap className="size-3.5" />
            <span>Motor Jurídico de Alta Velocidade para Advogados</span>
          </div>

          {/* Main Title */}
          <h1 className="mb-5 text-4xl font-bold tracking-tight text-foreground sm:text-6xl leading-[1.1]">
            Petições Judiciais completas, <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              redigidas em poucos segundos.
            </span>
          </h1>

          <p className="mb-8 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Narre os fatos do seu cliente por texto ou voz. Nossa IA estruturada elabora a petição inicial com fundamentação legal, doutrina, jurisprudência e formatação pronta para o PJe.
          </p>

          {/* ── Hero Call to Action Buttons ── */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "h-12 gap-2 bg-primary text-primary-foreground px-7 font-bold shadow-md hover:opacity-90")}
            >
              <span>Criar Conta Gratuita</span>
              <ArrowRight className="size-4" />
            </Link>

            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 border-border px-6 font-semibold")}
            >
              <span>Acessar Painel</span>
            </Link>
          </div>

          {/* Sub Hero Micro Badges */}
          <div className="flex flex-wrap justify-center gap-5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>Exportação nativa em .docx (Word)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span>Edição em tempo real com IA cirúrgica</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT PREVIEW (Mockup Window) ── */}
      <section className="relative z-10 flex w-full justify-center px-4 pb-20">
        <Card className="w-full max-w-3xl overflow-hidden border-border p-0 shadow-2xl">
          {/* Mockup Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-rose-500" />
              <div className="size-2.5 rounded-full bg-amber-500" />
              <div className="size-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              editor.smartdoc.work — peticao_inicial.docx
            </div>
            <div>
              <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                IA Ativa
              </Badge>
            </div>
          </div>

          {/* Mockup Document Body */}
          <div className="bg-card p-6 sm:p-12 font-serif text-sm leading-relaxed text-foreground opacity-95">
            <p className="mb-4 text-justify font-bold uppercase text-xs">
              EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE SÃO PAULO/SP
            </p>
            <p className="mb-4 text-justify">
              <strong>[NOME DO AUTOR]</strong>, brasileiro, solteiro, empresário, inscrito no CPF sob o nº [Número], residente em [Endereço Completo], por seu advogado que esta subscreve, vem propor a presente
            </p>
            <h3 className="my-5 text-center font-sans font-bold uppercase text-primary tracking-wide">
              AÇÃO DE RESCISÃO CONTRATUAL C/C INDENIZATÓRIA
            </h3>
            <p className="mb-4 text-justify">
              em face de <strong>[NOME DO RÉU]</strong>, pelos fatos e fundamentos a seguir aduzidos.
            </p>
            <div className="mt-6 rounded-r-xl border-l-4 border-primary bg-primary/5 p-4 font-sans text-xs italic text-muted-foreground">
              💡 <strong>Visual Law Integrado:</strong> A petição já é gerada estruturada em tópicos claros, sem marcadores confusos e com pedidos em alíneas precisas (a, b, c).
            </div>
          </div>
        </Card>
      </section>

      {/* ── BENTO GRID: RECURSOS ── */}
      <section id="recursos" className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Arquitetura Jurídica
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tudo o que seu escritório precisa para produzir mais rápido.
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Card 1 */}
          <Card className="flex flex-col justify-between p-7 md:col-span-2 border-border/80">
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Scale className="size-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                Fundamentação Técnica e Jurisprudência Coerente
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Chega de modelos genéricos ou petições vazias. Nosso modelo foi instruído para citar artigos pertinentes da legislação brasileira (CPC, CC, CDC, CLT) e construir teses jurídicas sólidas com base estrita no caso narrado.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="bg-muted/50 border-border">⚖️ Código de Processo Civil</Badge>
              <Badge variant="outline" className="bg-muted/50 border-border">🛡️ Código de Defesa do Consumidor</Badge>
              <Badge variant="outline" className="bg-muted/50 border-border">📜 Código Civil Brasileiro</Badge>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="flex flex-col justify-between p-7 border-border/80">
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Cpu className="size-5" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                Motor Groq de Baixa Latência
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Geração em streaming ultra veloz com até 8.192 tokens de saída, gerando peças longas e exaustivas sem truncamento.
              </p>
            </div>
            <div className="mt-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ⚡ Tempo médio: ~2.8s
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="p-7 border-border/80">
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <FileCode2 className="size-5" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Edição com IA Cirúrgica
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Dite ou digite qualquer ajuste na barra flutuante (&quot;mude o valor para R$ 10.000&quot;) e veja os parágrafos se atualizarem com diff visual.
            </p>
          </Card>

          {/* Card 4 */}
          <Card className="p-7 border-border/80">
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Exportação Word (.docx)
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Gere o documento final em formato Microsoft Word perfeitamente estruturado, pronto para revisão e protocolo direto nos tribunais (PJe, e-SAJ, Projudi).
            </p>
          </Card>

          {/* Card 5 */}
          <Card className="p-7 border-border/80">
            <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">
              Zero Alucinação de Dados
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Informações não fornecidas recebem marcadores inteligentes como <code>[NOME DO AUTOR]</code> e <code>[CPF]</code>, garantindo total segurança jurídica.
            </p>
          </Card>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="como-funciona" className="relative z-10 w-full border-y border-border/80 bg-muted/20 py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Fluxo Otimizado
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Do relato do cliente à petição pronta em 3 etapas.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Narre o Caso",
                desc: "Digite ou fale ao microfone os fatos relatados pelo cliente sem se preocupar com formalismos.",
                icon: <Mic className="size-5 text-primary" />
              },
              {
                step: "02",
                title: "IA Estrutura a Peça",
                desc: "O motor processual gera qualificação, fatos, teses de direito e pedidos em alíneas precisas.",
                icon: <Sparkles className="size-5 text-primary" />
              },
              {
                step: "03",
                title: "Edite e Exporte",
                desc: "Refine os pontos que desejar diretamente no editor ou via IA. Baixe em DOCX com 1 clique.",
                icon: <FileText className="size-5 text-primary" />
              },
            ].map((item, idx) => (
              <Card key={idx} className="p-6 border-border/80 bg-card">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    {item.icon}
                  </div>
                  <span className="font-mono text-2xl font-black text-muted-foreground/30">
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 text-base font-bold text-foreground">{item.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section id="faq" className="relative z-10 mx-auto w-full max-w-3xl px-4 py-20">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Tire suas dúvidas
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {[
            {
              q: "As petições geradas são compatíveis com os tribunais brasileiros?",
              a: "Sim! Toda a estrutura segue estritamente os requisitos do Art. 319 do CPC (Endereçamento, Qualificação, Fatos, Direito com legislação pertinente, Pedidos em alíneas e Valor da Causa)."
            },
            {
              q: "Posso editar o documento antes de baixar?",
              a: "Sim, o editor é totalmente livre e desbloqueado. Você pode alterar qualquer texto manualmente ou usar a barra de inteligência artificial para fazer edições cirúrgicas em tempo real."
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
            <Card
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              className="cursor-pointer p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                <ChevronDown
                  className={`size-4 text-muted-foreground transition-transform ${
                    openFaq === idx ? "rotate-180 text-primary" : ""
                  }`}
                />
              </div>
              {openFaq === idx && (
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 w-full border-t border-border/80 bg-card py-8 px-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <div>
            © {new Date().getFullYear()} SmartDoc. Ferramenta de inteligência artificial para advogados.
          </div>
          <div className="flex gap-5">
            <a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#faq" className="hover:text-foreground transition-colors">Dúvidas</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
