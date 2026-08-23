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
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  X,
  Mic,
  ArrowRight,
  Sun,
  Moon,
  CreditCard,
  User,
  KeyRound,
  Mail,
  Shield,
  Layers,
  Settings,
  Menu,
  Crown,
  Check,
  Briefcase,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  plan?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const isMobileRaw = useIsBreakpoint("max", 900);
  const isMobile = isMobileRaw ?? false;

  // Layout & Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"documents" | "plans" | "profile" | "security">("documents");

  // User & Data State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [editOab, setEditOab] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Edit State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passSaving, setPassSaving] = useState(false);

  // Modal State (Nova Petição)
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

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    setIsDark(!isDark);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    }
  };

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

        const currentProf = profData || {
          id: user.id,
          email: user.email || "",
          name: user.user_metadata?.name || "Advogado(a)",
          oab: user.user_metadata?.oab || "",
          plan: "Pro Trial",
        };

        setProfile(currentProf);
        setEditName(currentProf.name || "");
        setEditOab(currentProf.oab || "");
        setEditEmail(currentProf.email || "");

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
  }, []);

  const toggleDictation = () => {
    if (!recognition) {
      alert("Reconhecimento de voz não suportado neste navegador.");
      return;
    }
    if (isDictating) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleCreateDocument = async () => {
    if (!modalText.trim()) return;

    setIsSubmitting(true);
    try {
      const factsText = modalText.trim();
      let docId: string | null = null;

      if (profile?.id) {
        const createRes = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: factsText.slice(0, 60).replace(/\n/g, " ") + "...",
            facts: factsText,
            status: "draft",
            content_html: ""
          })
        });

        if (createRes.ok) {
          const createData = await createRes.json();
          if (createData.document?.id) {
            docId = createData.document.id;
          }
        }
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("extrajus_facts", factsText);
        localStorage.removeItem("extrajus_payment_status");
        localStorage.removeItem("extrajus_draft");
        window.location.href = docId ? `/editor?id=${docId}&generate=true` : "/editor?generate=true";
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: editName, oab: editOab }
      });
      if (error) throw error;

      // Update in profiles table if exists
      if (profile?.id) {
        await supabase
          .from("profiles")
          .update({ name: editName, oab: editOab })
          .eq("id", profile.id);
      }

      setProfile(prev => prev ? { ...prev, name: editName, oab: editOab } : null);
      setProfileMsg({ type: "success", text: "Perfil atualizado com sucesso!" });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Erro ao salvar perfil." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPassMsg({ type: "error", text: "A nova senha deve ter no mínimo 6 caracteres." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "As senhas não coincidem." });
      return;
    }

    setPassSaving(true);
    setPassMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setPassMsg({ type: "success", text: "Senha atualizada com sucesso!" });
    } catch (err: any) {
      setPassMsg({ type: "error", text: err.message || "Erro ao atualizar senha." });
    } finally {
      setPassSaving(false);
    }
  };

  // Filtros de Documentos
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
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Sidebar (Expandível / Colapsável) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-16"
        } ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/" className="flex items-center gap-2 overflow-hidden text-lg font-bold tracking-tight">
            {sidebarOpen ? (
              <>
                <span className="tracking-tight">SMART</span>
                <span className="text-primary">DOC</span>
                <Badge variant="outline" className="ml-1 border-primary/30 bg-primary/10 text-[9px] font-extrabold text-primary">
                  PRO
                </Badge>
              </>
            ) : (
              <span className="text-primary font-black text-xl">S</span>
            )}
          </Link>

          {!isMobile && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground"
              title={sidebarOpen ? "Recolher menu" : "Expandir menu"}
            >
              {sidebarOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            </Button>
          )}
        </div>

        {/* Action Button: Nova Petição */}
        <div className="p-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            className={`w-full bg-primary text-primary-foreground font-semibold shadow-md hover:opacity-90 transition-all ${
              sidebarOpen ? "justify-start gap-2 h-10 px-3" : "justify-center h-10 p-0"
            }`}
            title="Nova Petição"
          >
            <Plus className="size-4 shrink-0" />
            {sidebarOpen && <span>Nova Petição</span>}
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {/* Petições */}
          <button
            onClick={() => setActiveTab("documents")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "documents"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            } ${!sidebarOpen ? "justify-center px-0" : ""}`}
            title="Minhas Petições"
          >
            <FileText className="size-4.5 shrink-0" />
            {sidebarOpen && <span>Minhas Petições</span>}
          </button>

          {/* Planos de Assinatura */}
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "plans"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            } ${!sidebarOpen ? "justify-center px-0" : ""}`}
            title="Planos & Assinatura"
          >
            <Crown className="size-4.5 shrink-0" />
            {sidebarOpen && (
              <div className="flex flex-1 items-center justify-between">
                <span>Planos & Assinatura</span>
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] text-primary">
                  Pro
                </Badge>
              </div>
            )}
          </button>

          {/* Perfil & OAB */}
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            } ${!sidebarOpen ? "justify-center px-0" : ""}`}
            title="Meu Perfil"
          >
            <User className="size-4.5 shrink-0" />
            {sidebarOpen && <span>Meu Perfil (OAB)</span>}
          </button>

          {/* Segurança & Senha */}
          <button
            onClick={() => setActiveTab("security")}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "security"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            } ${!sidebarOpen ? "justify-center px-0" : ""}`}
            title="Segurança & Senha"
          >
            <ShieldCheck className="size-4.5 shrink-0" />
            {sidebarOpen && <span>Segurança & Senha</span>}
          </button>
        </nav>

        {/* Sidebar Footer: Profile & Logout */}
        <div className="border-t border-border p-3 space-y-2">
          {/* User badge */}
          <div className={`flex items-center gap-3 rounded-lg p-2 ${sidebarOpen ? "" : "justify-center"}`}>
            <Avatar className="size-8 border border-border">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                {profile?.name?.slice(0, 2).toUpperCase() || "ADV"}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-xs font-semibold text-foreground">{profile?.name}</div>
                <div className="truncate text-[11px] text-muted-foreground">{profile?.email}</div>
              </div>
            )}
          </div>

          {/* Theme & Logout */}
          <div className={`flex items-center gap-1 ${sidebarOpen ? "justify-between" : "flex-col"}`}>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              title={isDark ? "Modo Claro" : "Modo Escuro"}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>

            <Button
              variant="ghost"
              size={sidebarOpen ? "sm" : "icon-xs"}
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
              title="Sair da Conta"
            >
              <LogOut className="size-4 shrink-0" />
              {sidebarOpen && <span className="ml-1.5">Sair</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area (com margem dinâmica para a sidebar) ── */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-16"}`}>
        {/* Mobile Top Navbar */}
        {isMobile && (
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="size-5" />
            </Button>
            <div className="font-bold text-sm">
              <span className="text-foreground">SMART</span>
              <span className="text-primary">DOC</span>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </header>
        )}

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* ════ TAB 1: MINHAS PETIÇÕES ════ */}
          {activeTab === "documents" && (
            <div>
              {/* Top Banner Greeting */}
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Olá, {profile?.name?.split(" ")[0]} 👋
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Painel de controle e elaboração de petições judiciais.
                  </p>
                </div>

                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-primary text-primary-foreground font-semibold shadow-md hover:opacity-90 sm:self-auto self-start gap-1.5 text-xs h-9 px-4"
                >
                  <Sparkles className="size-3.5" />
                  <span>Nova Petição com IA</span>
                </Button>
              </div>

              {/* Metric Cards */}
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total de Peças
                    </div>
                    <div className="mt-1 text-2xl font-bold text-foreground">{totalDocuments}</div>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="size-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Prontas / Finalizadas
                    </div>
                    <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-500">{completedDocuments}</div>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
                    <CheckCircle2 className="size-5" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Em Rascunho / Edição
                    </div>
                    <div className="mt-1 text-2xl font-bold text-muted-foreground">{draftDocuments}</div>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Clock className="size-5" />
                  </div>
                </div>
              </div>

              {/* Section Header & Filters */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Suas Petições e Documentos
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gerencie, continue redigindo ou exporte suas peças processuais.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
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

                  <div className="flex rounded-lg border border-border bg-card p-0.5">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        statusFilter === "all"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Todas ({totalDocuments})
                    </button>
                    <button
                      onClick={() => setStatusFilter("completed")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        statusFilter === "completed"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Prontas
                    </button>
                    <button
                      onClick={() => setStatusFilter("draft")}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                        statusFilter === "draft"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Rascunhos
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Cards Grid */}
              {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-44 animate-pulse rounded-xl border border-border bg-card/50 p-5" />
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <FileText className="size-7" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-foreground">Nenhuma petição encontrada</h3>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    {searchQuery ? "Nenhum documento corresponde à sua pesquisa." : "Comece descrevendo os fatos de um novo caso para gerar a petição inicial."}
                  </p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-5 bg-primary text-primary-foreground font-semibold shadow-md hover:opacity-90 text-xs h-9"
                  >
                    <Plus className="size-3.5 mr-1" />
                    Criar Primeira Petição
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDocuments.map((doc) => (
                    <Card
                      key={doc.id}
                      onClick={() => router.push(`/editor?id=${doc.id}`)}
                      className="group cursor-pointer border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold ${
                              doc.status === "completed"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {doc.status === "completed" ? "Pronta para Uso" : "Rascunho"}
                          </Badge>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={deletingId === doc.id}
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-opacity"
                            title="Excluir Petição"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>

                        <CardTitle className="line-clamp-2 mt-2 text-sm font-bold leading-snug group-hover:text-primary transition-colors">
                          {doc.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="p-4 pt-0">
                        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-3">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatDate(doc.updated_at)}
                          </span>
                          <span className="flex items-center gap-0.5 font-semibold text-primary group-hover:underline">
                            Abrir <ChevronRight className="size-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 2: PLANOS DE ASSINATURA ════ */}
          {activeTab === "plans" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Planos & Assinatura</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Escolha o plano ideal para a escala de produção jurídica do seu escritório.
                </p>
              </div>

              {/* Status do Plano Atual */}
              <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                    <Crown className="size-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">Seu Plano Atual: Pro Trial</div>
                    <div className="text-xs text-muted-foreground">Acesso a modelos de alta densidade e exportação ilimitada em DOCX</div>
                  </div>
                </div>
                <Badge className="bg-primary text-primary-foreground font-bold">Ativo</Badge>
              </div>

              {/* Grade de Planos */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Individual */}
                <Card className="flex flex-col justify-between border-border bg-card p-6">
                  <div>
                    <Badge variant="outline" className="border-border text-muted-foreground text-xs">Individual</Badge>
                    <div className="mt-4 text-3xl font-extrabold">R$ 97<span className="text-xs text-muted-foreground font-normal">/mês</span></div>
                    <p className="mt-2 text-xs text-muted-foreground">Para advogados autônomos que buscam agilidade na rotina.</p>
                    
                    <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> 30 Petições por mês</li>
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Visual Law e formatação padrão</li>
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Exportação ilimitada (.docx)</li>
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Ditado por voz local</li>
                    </ul>
                  </div>

                  <Button variant="outline" className="mt-6 w-full border-border">
                    Migrar para Individual
                  </Button>
                </Card>

                {/* Profissional (Destaque) */}
                <Card className="relative flex flex-col justify-between border-2 border-primary bg-card p-6 shadow-xl shadow-primary/5">
                  <div className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-extrabold text-primary-foreground uppercase">
                    Mais Popular
                  </div>
                  <div>
                    <Badge className="bg-primary text-primary-foreground text-xs">Profissional Pro</Badge>
                    <div className="mt-4 text-3xl font-extrabold text-foreground">R$ 197<span className="text-xs text-muted-foreground font-normal">/mês</span></div>
                    <p className="mt-2 text-xs text-muted-foreground">Para escritórios que exigem profundidade máxima e escala.</p>
                    
                    <ul className="mt-6 space-y-2.5 text-xs text-foreground font-medium">
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> <strong>Petições Ilimitadas</strong></li>
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Modelos jurídicos de raciocínio profundo</li>
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Reescrita inteligente via IA flutuante</li>
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Suporte prioritário via WhatsApp</li>
                    </ul>
                  </div>

                  <Button className="mt-6 w-full bg-primary text-primary-foreground font-semibold shadow-md hover:opacity-90">
                    Manter Plano Pro
                  </Button>
                </Card>

                {/* Escritório / Equipe */}
                <Card className="flex flex-col justify-between border-border bg-card p-6">
                  <div>
                    <Badge variant="outline" className="border-border text-muted-foreground text-xs">Boutique & Equipes</Badge>
                    <div className="mt-4 text-3xl font-extrabold">R$ 397<span className="text-xs text-muted-foreground font-normal">/mês</span></div>
                    <p className="mt-2 text-xs text-muted-foreground">Multi-usuários com centralização de documentos da banca.</p>
                    
                    <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Até 5 contas para advogados</li>
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Painel de gestão unificado</li>
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Modelos personalizados do escritório</li>
                      <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Gerente de conta dedicado</li>
                    </ul>
                  </div>

                  <Button variant="outline" className="mt-6 w-full border-border">
                    Falar com Consultor
                  </Button>
                </Card>
              </div>
            </div>
          )}

          {/* ════ TAB 3: MEU PERFIL & OAB ════ */}
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Perfil Profissional</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atualize suas credenciais forenses para preenchimento automático nas petições.
                </p>
              </div>

              {profileMsg && (
                <div className={`flex items-center gap-2 rounded-lg p-3 text-xs font-medium ${
                  profileMsg.type === "success"
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border border-destructive/30 bg-destructive/10 text-destructive"
                }`}>
                  {profileMsg.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <Card className="border-border bg-card p-6">
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Nome Completo do Advogado(a)</Label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Dr. Carlos Eduardo da Silva"
                        className="pl-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="oab">Número da OAB / Seccional</Label>
                    <div className="relative flex items-center">
                      <Briefcase className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="oab"
                        value={editOab}
                        onChange={(e) => setEditOab(e.target.value)}
                        placeholder="Ex: OAB/SP 123.456"
                        className="pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">E-mail Cadastrado</Label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="email"
                        value={editEmail}
                        disabled
                        className="pl-9 text-sm bg-muted/50 cursor-not-allowed opacity-75"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">O e-mail principal é vinculado à sua conta de autenticação.</p>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={profileSaving}
                      className="bg-primary text-primary-foreground font-semibold shadow-md hover:opacity-90 text-xs"
                    >
                      {profileSaving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* ════ TAB 4: SEGURANÇA & SENHA ════ */}
          {activeTab === "security" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Segurança & Senha</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atualize sua senha de acesso e mantenha sua conta protegida.
                </p>
              </div>

              {passMsg && (
                <div className={`flex items-center gap-2 rounded-lg p-3 text-xs font-medium ${
                  passMsg.type === "success"
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border border-destructive/30 bg-destructive/10 text-destructive"
                }`}>
                  {passMsg.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                  <span>{passMsg.text}</span>
                </div>
              )}

              <Card className="border-border bg-card p-6">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPass">Nova Senha</Label>
                    <div className="relative flex items-center">
                      <KeyRound className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="newPass"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pl-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confPass">Confirmar Nova Senha</Label>
                    <div className="relative flex items-center">
                      <Shield className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="confPass"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="pl-9 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={passSaving}
                      className="bg-primary text-primary-foreground font-semibold shadow-md hover:opacity-90 text-xs"
                    >
                      {passSaving ? "Atualizando..." : "Alterar Senha"}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog: Criar Nova Petição ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl border-border bg-card p-6 shadow-2xl rounded-2xl">
          <DialogHeader>
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>Inteligência Artificial Jurídica</span>
            </div>
            <DialogTitle className="mt-3 text-xl font-bold tracking-tight text-foreground">
              Descreva o Caso do seu Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cole os fatos brutos, mensagens de WhatsApp ou digite/dite a narrativa. Nossa IA gerará a Petição Inicial completa estruturada.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <textarea
                rows={6}
                value={modalText}
                onChange={(e) => setModalText(e.target.value)}
                placeholder="Ex: O autor celebrou contrato de compra de imóvel na planta com a construtora X em janeiro de 2022, com prazo de entrega para dezembro de 2023. Ocorreu atraso injustificado superior a 180 dias..."
                className="w-full rounded-xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none"
              />

              <button
                type="button"
                onClick={toggleDictation}
                className={`absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                  isDictating
                    ? "border-destructive bg-destructive/10 text-destructive animate-pulse"
                    : "border-border bg-muted/80 text-muted-foreground hover:text-foreground"
                }`}
                title={isDictating ? "Parar Gravação" : "Ditar por Voz"}
              >
                <Mic className="size-4" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground">
                {modalText.length} caracteres
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-border text-xs h-9"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateDocument}
                  disabled={!modalText.trim() || isSubmitting}
                  className="bg-primary text-primary-foreground font-semibold shadow-md hover:opacity-90 text-xs h-9 gap-1.5"
                >
                  {isSubmitting ? "Iniciando..." : (
                    <>
                      <span>Gerar Petição</span>
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
