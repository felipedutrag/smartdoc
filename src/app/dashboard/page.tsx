"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Trash2,
  LogOut,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  X,
  Mic,
  ArrowRight,
  Sun,
  Moon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DocumentItem {
  id: string;
  title: string;
  action_type: string;
  status: "draft" | "generating" | "completed" | "archived";
  is_paid: boolean;
  word_count: number;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  oab?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const isMobileRaw = useIsBreakpoint("max", 800);
  const isMobile = isMobileRaw ?? false;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      const isDarkTheme = savedTheme === "dark" || (!savedTheme && document.documentElement.classList.contains("dark"));
      setIsDark(isDarkTheme);
    }
  }, []);

  // Carregar perfil e documentos
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Buscar perfil
        const { data: profData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setProfile(
          profData || {
            id: user.id,
            email: user.email || "",
            name: user.user_metadata?.name || "Advogado(a)",
            oab: user.user_metadata?.oab || "",
          }
        );

        // Buscar documentos
        const { data: docsData, error: docsError } = await supabase
          .from("documents")
          .select("id, title, action_type, status, is_paid, word_count, created_at, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (!docsError && docsData) {
          setDocuments(docsData as DocumentItem[]);
        }
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Configurar reconhecimento de fala
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "pt-BR";

        rec.onstart = () => setIsDictating(true);
        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          setModalText(prev => prev ? prev + " " + resultText : resultText);
        };
        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error !== "no-speech") setIsDictating(false);
        };
        rec.onend = () => setIsDictating(false);
        setRecognition(rec);
      }
    }
  }, [router, supabase]);

  const toggleDictation = () => {
    if (!recognition) {
      alert("Reconhecimento de fala não suportado neste navegador.");
      return;
    }
    if (isDictating) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleCreateDocument = async () => {
    if (!modalText.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Criação direta e única no banco
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: modalText.trim().slice(0, 70).replace(/\n/g, " ") + "...",
          facts: modalText.trim(),
          status: "draft",
          content_html: ""
        })
      });

      if (res.ok) {
        const data = await res.json();
        const docId = data.document?.id;
        if (typeof window !== "undefined") {
          localStorage.setItem("extrajus_facts", modalText.trim());
          localStorage.removeItem("extrajus_payment_status");
          localStorage.removeItem("extrajus_draft");
          window.location.href = docId ? `/editor?id=${docId}&generate=true` : "/editor?generate=true";
        }
      } else {
        if (typeof window !== "undefined") {
          localStorage.setItem("extrajus_facts", modalText.trim());
          localStorage.removeItem("extrajus_payment_status");
          localStorage.removeItem("extrajus_draft");
          window.location.href = "/editor?generate=true";
        }
      }
    } catch (e) {
      console.error(e);
      window.location.href = "/editor?generate=true";
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta petição?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
      } else {
        alert("Falha ao excluir o documento.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir o documento.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtros
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.action_type && doc.action_type.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "completed") return matchesSearch && doc.status === "completed";
    if (statusFilter === "draft") return matchesSearch && doc.status === "draft";
    return matchesSearch;
  });

  const totalDocuments = documents.length;
  const completedDocuments = documents.filter(d => d.status === "completed").length;
  const draftDocuments = documents.filter(d => d.status === "draft" || d.status === "generating").length;

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="inline-flex items-center text-xl font-bold tracking-tight">
              <span>SMART</span>
              <span className="ml-0.5 text-primary">DOC</span>
              <Badge variant="outline" className="ml-2 border-primary/30 bg-primary/10 text-[10px] font-extrabold text-primary">
                PRO
              </Badge>
            </Link>

            {!isMobile && (
              <span className="text-xs font-medium text-muted-foreground">
                Painel do Advogado
              </span>
            )}
          </div>

          {/* Theme Toggle & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const nextDark = !isDark;
                setIsDark(nextDark);
                if (nextDark) {
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
              className="size-9 rounded-lg"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            {/* Profile badge / Avatar */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-1.5 sm:px-3 sm:py-1.5">
              <Avatar className="size-8 rounded-lg bg-primary font-bold text-primary-foreground text-xs">
                <AvatarFallback className="bg-transparent text-primary-foreground font-bold">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : "A"}
                </AvatarFallback>
              </Avatar>

              {!isMobile && (
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight">
                    {profile?.name || "Advogado"}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {profile?.oab ? profile.oab : profile?.email}
                  </span>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                title="Sair da Conta"
                className="size-7 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Metric Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total */}
          <Card className="flex items-center justify-between p-5 border-border shadow-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total de Peças
              </div>
              <div className="mt-1 text-2xl font-bold">{totalDocuments}</div>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
          </Card>

          {/* Completed */}
          <Card className="flex items-center justify-between p-5 border-border shadow-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prontas / Finalizadas
              </div>
              <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-500">{completedDocuments}</div>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="size-5" />
            </div>
          </Card>

          {/* Drafts */}
          <Card className="flex items-center justify-between p-5 border-border shadow-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Em Rascunho / Edição
              </div>
              <div className="mt-1 text-2xl font-bold text-muted-foreground">{draftDocuments}</div>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Clock className="size-5" />
            </div>
          </Card>
        </div>

        {/* Section Header & Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Suas Petições e Documentos
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gerencie, continue redigindo ou exporte suas peças processuais.
            </p>
          </div>

          {/* Filter tabs & Search Bar */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por título ou ação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-lg border border-border bg-muted/40 p-1">
              {[
                { id: "all", label: "Todas" },
                { id: "completed", label: "Prontas" },
                { id: "draft", label: "Rascunhos" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    statusFilter === tab.id
                      ? "bg-background text-primary shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action: Nova Petição Button */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-9 gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm hover:opacity-90"
            >
              <span>Nova Petição</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Documents Grid / List */}
        {loading ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <Clock className="size-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Carregando suas petições...</p>
          </Card>
        ) : filteredDocuments.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="size-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Nenhuma petição encontrada
            </h3>
            <p className="mx-auto mt-1 mb-5 max-w-sm text-xs text-muted-foreground">
              {searchQuery
                ? "Nenhum documento corresponde ao termo pesquisado."
                : "Você ainda não criou nenhuma peça. Comece a redigir sua primeira petição agora."}
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="gap-2 bg-primary text-primary-foreground font-semibold hover:opacity-90"
            >
              <span>Criar Nova Petição</span>
              <ArrowRight className="size-4" />
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <Card
                key={doc.id}
                onClick={() => router.push(`/editor?id=${doc.id}`)}
                className="group relative flex flex-col justify-between p-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md cursor-pointer"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="outline" className="border-primary/20 bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wide">
                      {doc.action_type || "Petição Inicial"}
                    </Badge>

                    {doc.status === "completed" ? (
                      <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 gap-1">
                        <CheckCircle2 className="size-3" />
                        Pronta
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-border bg-muted/50 text-[10px] font-semibold text-muted-foreground gap-1">
                        <Clock className="size-3" />
                        Rascunho
                      </Badge>
                    )}
                  </div>

                  <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {doc.title || "Petição sem título"}
                  </h3>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                  <div>
                    <span>{formatDate(doc.updated_at)}</span>
                    {doc.word_count > 0 && <span> • {doc.word_count} palavras</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      disabled={deletingId === doc.id}
                      title="Excluir Petição"
                      className="size-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>

                    <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
                      <span>Abrir</span>
                      <ChevronRight className="size-3.5" />
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal de Nova Petição (Dialog shadcn) ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden border-border">
          <DialogHeader className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Nova Petição Inicial com IA
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Descreva detalhadamente os fatos ou clique nos modelos rápidos abaixo.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Quick chips */}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-muted/30 p-2.5 px-5">
            {[
              { label: "Ação de Cobrança", text: "Ação de cobrança fundada em prestação de serviços não adimplida, com pedido de atualização monetária e juros de mora." },
              { label: "Despejo por Falta de Pagamento", text: "Ação de despejo por falta de pagamento cumulada com cobrança de aluguéis e encargos locatícios em atraso há 3 meses." },
              { label: "Indenizatória Dano Moral", text: "Ação declaratória de inexistência de débito c/c reparação por danos morais e tutela de urgência devido a negativação indevida no SPC/Serasa." },
              { label: "Obrigação de Fazer (Saúde)", text: "Ação com pedido de tutela provisória de urgência de natureza antecipada para fornecimento de medicamento de alto custo pelo plano de saúde/Estado." },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setModalText(chip.text)}
                className="whitespace-nowrap rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4">
            <textarea
              value={modalText}
              onChange={(e) => setModalText(e.target.value)}
              placeholder="Descreva os fatos do caso (ex: O autor celebrou contrato de locação com o réu em 10/01/2023 pelo valor mensal de R$ 3.500,00. Ocorre que o réu deixou de adimplir os aluguéis a partir de outubro de 2023...)"
              rows={5}
              className="w-full resize-y rounded-xl border border-border bg-background p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary"
            />

            {/* Action Toolbar */}
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant={isDictating ? "destructive" : "outline"}
                size="sm"
                onClick={toggleDictation}
                className="gap-2 text-xs rounded-full"
              >
                <Mic className={`size-3.5 ${isDictating ? "animate-pulse" : ""}`} />
                <span>{isDictating ? "Gravando voz..." : "Ditar por voz"}</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateDocument}
                  disabled={!modalText.trim() || isSubmitting}
                  className="bg-primary text-primary-foreground hover:opacity-90 font-semibold gap-1.5"
                >
                  <span>{isSubmitting ? "Iniciando IA..." : "Gerar Petição"}</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
