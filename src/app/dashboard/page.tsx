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
  ShieldCheck,
  Mic,
  ArrowRight,
  Sun,
  Moon,
  User,
  KeyRound,
  Mail,
  Shield,
  Menu,
  Crown,
  Check,
  Briefcase,
  AlertCircle,
  Bell,
  Keyboard,
  Command,
  HelpCircle,
  ExternalLink,
  Scale,
  Video,
  FileSignature,
  Activity,
  Copy,
  CheckCheck,
  QrCode,
  Loader2,
  Zap,
  X
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  petitions_limit?: number;
  petitions_used?: number;
  credits_reset_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const isMobileRaw = useIsBreakpoint("max", 900);
  const isMobile = isMobileRaw ?? false;

  // Layout & Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "plans" | "profile">("documents");

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

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");
  const [isDictating, setIsDictating] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pix Payment State (Subscription via Realtime Webhook - No Polling)
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; name: string; price: number; description: string } | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixData, setPixData] = useState<{ id: string; pixCode: string; pixQrCode: string; externalId: string } | null>(null);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixSuccess, setPixSuccess] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  // Toast de Pagamento Recebido (Linear Style)
  const [paymentToast, setPaymentToast] = useState<{ show: boolean; title: string; message: string; planName?: string; time?: string } | null>(null);

  const triggerPaymentToast = (planName: string) => {
    setPaymentToast({
      show: true,
      title: "Pagamento Recebido!",
      message: `Sua assinatura do plano ${planName} foi confirmada e está 100% ativa.`,
      planName,
      time: "Agora mesmo"
    });

    setNotifications(prev => [
      {
        id: String(Date.now()),
        title: `Pagamento Aprovado (${planName})`,
        description: `Sua assinatura do plano ${planName} está ativa com sucesso via Webhook.`,
        time: "Agora",
        read: false,
      },
      ...prev
    ]);

    setTimeout(() => {
      setPaymentToast(prev => prev ? { ...prev, show: false } : null);
    }, 7000);
  };

  const handleOpenPixModal = async (plan: { id: string; name: string; price: number; description: string }) => {
    setSelectedPlan(plan);
    setIsPixModalOpen(true);
    setPixLoading(true);
    setPixError(null);
    setPixSuccess(false);
    setPixData(null);

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          customerName: profile?.name,
          customerEmail: profile?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Não foi possível gerar a cobrança Pix.");
      }

      setPixData(data);
    } catch (err: any) {
      console.error("Erro ao gerar Pix:", err);
      setPixError(err.message || "Erro de conexão ao gerar o Pix.");
    } finally {
      setPixLoading(false);
    }
  };

  // Escuta confirmação de pagamento em tempo real via Supabase Realtime (SEM POLLING e com cleanup correto)
  useEffect(() => {
    if (!isPixModalOpen || !pixData?.externalId || pixSuccess) return;

    const externalId = pixData.externalId;
    const planName = selectedPlan?.name || "Profissional Pro";

    // Criar canal único por ID de transação para evitar colisões
    const paymentChannel = supabase
      .channel(`payment_rt_${externalId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `external_id=eq.${externalId}`,
        },
        (payload) => {
          console.log("[Webhook Realtime] Pagamento confirmado:", payload);
          if (payload.new && (payload.new.status === "PAID" || payload.new.status === "COMPLETE")) {
            setPixSuccess(true);
            setProfile((prev) => prev ? { ...prev, plan: planName } : null);
            triggerPaymentToast(planName);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paymentChannel);
    };
  }, [isPixModalOpen, pixData?.externalId, pixSuccess, selectedPlan?.name]);

  // Ouvinte global em tempo real para pagamentos e atualizações de plano do usuário (mesmo com modal fechado)
  useEffect(() => {
    if (!profile?.id) return;

    const userPaymentChannel = supabase
      .channel(`user_payments_${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new.status === "PAID" || payload.new.status === "COMPLETE")) {
            const plan = profile.plan || "Profissional Pro";
            triggerPaymentToast(plan);
          }
        }
      )
      .subscribe();

    const userProfileChannel = supabase
      .channel(`user_profile_plan_${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.new?.plan && payload.new.plan !== profile.plan) {
            setProfile((prev) => prev ? { ...prev, plan: payload.new.plan } : null);
            triggerPaymentToast(payload.new.plan);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userPaymentChannel);
      supabase.removeChannel(userProfileChannel);
    };
  }, [profile?.id, profile?.plan]);

  const handleCopyPix = () => {
    if (pixData?.pixCode) {
      navigator.clipboard.writeText(pixData.pixCode);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "Modelos com Raciocínio Profundo Ativos",
      description: "Agora as petições são geradas com jurisprudências atualizadas e fundamentação exaustiva.",
      time: "Há 10 min",
      read: false,
    },
    {
      id: "2",
      title: "Exportação em Word (.docx) Calibrada",
      description: "Seus arquivos exportam com fonte Cambria e Visual Law perfeitamente formatados.",
      time: "Há 1 hora",
      read: false,
    },
    {
      id: "3",
      title: "Bem-vindo ao SmartDoc Pro",
      description: "Você está no período de avaliação Pro com acesso completo.",
      time: "Hoje",
      read: true,
    }
  ]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

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

  // Atalhos Globais de Teclado (Alt+N: Nova Petição, Alt+K / Ctrl+K: Atalhos, Escape: Fechar Modais)
  // Utiliza Alt / Modificadores sem colisão com comandos reservados de navegador (como Ctrl+N no Chrome)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput = target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );

      // Escape sempre fecha modais mesmo em inputs
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setIsShortcutsModalOpen(false);
        return;
      }

      // Se o usuário estiver digitando em um campo de texto, não disparar atalhos de navegação
      if (isInput) return;

      // Nova Petição: Alt + N (ou tecla 'c' no estilo Linear)
      if ((e.altKey && e.key.toLowerCase() === "n") || e.key.toLowerCase() === "c") {
        e.preventDefault();
        setIsModalOpen(true);
      }

      // Janela de Atalhos: Alt + K, Ctrl + K ou ?
      if ((e.altKey && e.key.toLowerCase() === "k") || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") || e.key === "?") {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
      }

      // Navegar pelas abas com atalhos numéricos 1, 2, 3
      if (e.key === "1") {
        setActiveTab("documents");
      } else if (e.key === "2") {
        setActiveTab("plans");
      } else if (e.key === "3") {
        setActiveTab("profile");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

        if (createRes.status === 403) {
          const errData = await createRes.json();
          setIsSubmitting(false);
          alert(errData.error || "Limite mensal de petições atingido. Escolha um plano para continuar gerando peças.");
          setIsModalOpen(false);
          setActiveTab("plans");
          return;
        }

        if (createRes.ok) {
          const createData = await createRes.json();
          if (createData.credits) {
            setProfile(prev => prev ? { ...prev, petitions_used: createData.credits.used } : null);
          }
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

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

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

  const renderSidebarNavigation = (isDrawer = false) => (
    <div className="flex flex-col h-full justify-between bg-card/60 backdrop-blur-xl border-r border-border/70">
      <div>
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b border-border/70 px-4">
          <Link href="/" className="flex items-center gap-2 overflow-hidden text-sm font-bold tracking-tight">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Scale className="size-3.5" />
            </div>
            {(sidebarOpen || isDrawer) && (
              <div className="flex items-center">
                <span className="tracking-tight">SMART</span>
                <span className="text-primary font-black ml-0.5">DOC</span>
                <span className="ml-2 rounded-full border border-border/80 bg-muted/60 px-1.5 py-0.2 font-mono text-[8px] font-semibold text-muted-foreground uppercase">
                  PRO
                </span>
              </div>
            )}
          </Link>

          {!isMobile && !isDrawer && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-muted-foreground hover:text-foreground size-7 rounded-md"
              title={sidebarOpen ? "Recolher menu" : "Expandir menu"}
            >
              {sidebarOpen ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </Button>
          )}
        </div>

        {/* Action Button: Nova Petição (Linear Style) */}
        <div className="p-3">
          <Button
            onClick={() => {
              if (isDrawer) setMobileDrawerOpen(false);
              setIsModalOpen(true);
            }}
            className={`w-full bg-primary text-primary-foreground font-semibold shadow-xs hover:opacity-90 transition-all text-xs ${
              (sidebarOpen || isDrawer) ? "justify-start gap-2 h-9 px-3 rounded-lg" : "justify-center h-9 p-0 rounded-lg"
            }`}
            title="Nova Petição (Alt+N ou tecla C)"
          >
            <Plus className="size-3.5 shrink-0" />
            {(sidebarOpen || isDrawer) && (
              <div className="flex flex-1 items-center justify-between">
                <span>Nova Petição</span>
                <kbd className="font-mono text-[9px] bg-primary-foreground/20 px-1 py-0.2 rounded text-primary-foreground">
                  Alt N
                </kbd>
              </div>
            )}
          </Button>
        </div>

        {/* Navigation Items (Linear Style) */}
        <nav className="space-y-0.5 px-2 py-1">
          {/* Petições */}
          <Button
            variant="ghost"
            onClick={() => {
              setActiveTab("documents");
              if (isDrawer) setMobileDrawerOpen(false);
            }}
            className={`w-full text-xs h-8.5 rounded-lg transition-colors ${(sidebarOpen || isDrawer) ? "justify-start gap-2.5 px-2.5" : "justify-center px-0"} ${
              activeTab === "documents"
                ? "bg-muted/80 text-foreground font-semibold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-normal"
            }`}
            title="Minhas Petições"
          >
            <FileText className="size-3.5 shrink-0 text-primary" />
            {(sidebarOpen || isDrawer) && <span>Minhas Petições</span>}
          </Button>

          {/* Videoconferências (Em Breve) */}
          <div
            className={`flex items-center w-full text-xs h-8.5 rounded-lg opacity-50 cursor-not-allowed ${(sidebarOpen || isDrawer) ? "justify-start gap-2.5 px-2.5" : "justify-center px-0"} text-muted-foreground`}
            title="Videoconferências (Em Breve)"
          >
            <Video className="size-3.5 shrink-0" />
            {(sidebarOpen || isDrawer) && (
              <div className="flex flex-1 items-center justify-between">
                <span>Videoconferências</span>
                <span className="font-mono text-[9px] text-muted-foreground border border-border px-1.5 py-0.2 rounded-full">
                  Em breve
                </span>
              </div>
            )}
          </div>

          {/* Criador de Contratos */}
          <div
            className={`flex items-center w-full text-xs h-8.5 rounded-lg opacity-50 cursor-not-allowed ${(sidebarOpen || isDrawer) ? "justify-start gap-2.5 px-2.5" : "justify-center px-0"} text-muted-foreground`}
            title="Criador de Contratos (Em Breve)"
          >
            <FileText className="size-3.5 shrink-0" />
            {(sidebarOpen || isDrawer) && (
              <div className="flex flex-1 items-center justify-between">
                <span>Criador de Contratos</span>
                <span className="font-mono text-[9px] bg-muted border border-border/60 px-1.5 py-0.2 rounded-full">
                  Em Breve
                </span>
              </div>
            )}
          </div>

          {/* Notificação Extrajudicial */}
          <div
            className={`flex items-center w-full text-xs h-8.5 rounded-lg opacity-50 cursor-not-allowed ${(sidebarOpen || isDrawer) ? "justify-start gap-2.5 px-2.5" : "justify-center px-0"} text-muted-foreground`}
            title="Notificação Extrajudicial (Em Breve)"
          >
            <AlertCircle className="size-3.5 shrink-0" />
            {(sidebarOpen || isDrawer) && (
              <div className="flex flex-1 items-center justify-between">
                <span className="truncate max-w-[130px]">Notificação Extrajudicial</span>
                <span className="font-mono text-[9px] bg-muted border border-border/60 px-1.5 py-0.2 rounded-full shrink-0">
                  Em Breve
                </span>
              </div>
            )}
          </div>

          {/* Assinatura Digital */}
          <div
            className={`flex items-center w-full text-xs h-8.5 rounded-lg opacity-50 cursor-not-allowed ${(sidebarOpen || isDrawer) ? "justify-start gap-2.5 px-2.5" : "justify-center px-0"} text-muted-foreground`}
            title="Assinatura Digital (Em Breve)"
          >
            <FileSignature className="size-3.5 shrink-0" />
            {(sidebarOpen || isDrawer) && (
              <div className="flex flex-1 items-center justify-between">
                <span>Assinatura Digital</span>
                <span className="font-mono text-[9px] bg-muted border border-border/60 px-1.5 py-0.2 rounded-full">
                  Em Breve
                </span>
              </div>
            )}
          </div>

          {/* Acompanhamento Processual */}
          <div
            className={`flex items-center w-full text-xs h-8.5 rounded-lg opacity-50 cursor-not-allowed ${(sidebarOpen || isDrawer) ? "justify-start gap-2.5 px-2.5" : "justify-center px-0"} text-muted-foreground`}
            title="Acompanhamento Processual (Em Breve)"
          >
            <Activity className="size-3.5 shrink-0" />
            {(sidebarOpen || isDrawer) && (
              <div className="flex flex-1 items-center justify-between">
                <span className="truncate max-w-[125px]">Acomp. Processual</span>
                <span className="font-mono text-[9px] bg-muted border border-border/60 px-1.5 py-0.2 rounded-full shrink-0">
                  Em Breve
                </span>
              </div>
            )}
          </div>

          {/* Planos de Assinatura */}
          <Button
            variant="ghost"
            onClick={() => {
              setActiveTab("plans");
              if (isDrawer) setMobileDrawerOpen(false);
            }}
            className={`w-full text-xs h-8.5 rounded-lg transition-colors ${(sidebarOpen || isDrawer) ? "justify-start gap-2.5 px-2.5" : "justify-center px-0"} ${
              activeTab === "plans"
                ? "bg-muted/80 text-foreground font-semibold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-normal"
            }`}
            title="Planos & Assinatura"
          >
            <Crown className="size-3.5 shrink-0 text-amber-500" />
            {(sidebarOpen || isDrawer) && (
              <div className="flex flex-1 items-center justify-between">
                <span>Planos & Assinatura</span>
                <span className="font-mono text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.2 rounded-full">
                  Pro
                </span>
              </div>
            )}
          </Button>

          {/* Perfil & Segurança Unificado */}
          <Button
            variant="ghost"
            onClick={() => {
              setActiveTab("profile");
              if (isDrawer) setMobileDrawerOpen(false);
            }}
            className={`w-full text-xs h-8.5 rounded-lg transition-colors ${(sidebarOpen || isDrawer) ? "justify-start gap-2.5 px-2.5" : "justify-center px-0"} ${
              activeTab === "profile"
                ? "bg-muted/80 text-foreground font-semibold border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40 font-normal"
            }`}
            title="Meu Perfil"
          >
            <User className="size-3.5 shrink-0" />
            {(sidebarOpen || isDrawer) && <span>Meu Perfil</span>}
          </Button>
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-border/80 p-2.5 space-y-2 bg-muted/20">
        {/* Credits Status Widget (Linear Style) */}
        {(sidebarOpen || isDrawer) && (
          <div className="rounded-xl border border-border/80 bg-card/80 p-2.5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Scale className="size-3 text-primary" />
                <span>Petições no Mês</span>
              </span>
              <span className="font-mono text-[10px] font-bold text-foreground">
                {profile?.petitions_used ?? 0} / {profile?.petitions_limit ?? 30}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  ((profile?.petitions_used ?? 0) / (profile?.petitions_limit ?? 30)) >= 0.9
                    ? "bg-destructive"
                    : ((profile?.petitions_used ?? 0) / (profile?.petitions_limit ?? 30)) >= 0.7
                    ? "bg-amber-500"
                    : "bg-primary"
                }`}
                style={{
                  width: `${Math.min(100, Math.round(((profile?.petitions_used ?? 0) / (profile?.petitions_limit ?? 30)) * 100))}%`,
                }}
              />
            </div>
            
            <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
              <span>{Math.max(0, (profile?.petitions_limit ?? 30) - (profile?.petitions_used ?? 0))} restantes</span>
              <button
                onClick={() => {
                  setActiveTab("plans");
                  if (isDrawer) setMobileDrawerOpen(false);
                }}
                className="text-primary hover:underline font-sans font-semibold cursor-pointer"
              >
                + Créditos
              </button>
            </div>
          </div>
        )}

        {/* User Card */}
        <div className={`flex items-center gap-2.5 rounded-lg p-2 ${(sidebarOpen || isDrawer) ? "" : "justify-center"}`}>
          <Avatar className="size-7 border border-border/70 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-[10px]">
              {profile?.name?.slice(0, 2).toUpperCase() || "ADV"}
            </AvatarFallback>
          </Avatar>
          {(sidebarOpen || isDrawer) && (
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-xs font-semibold text-foreground">{profile?.name}</div>
              <div className="truncate font-mono text-[10px] text-muted-foreground">{profile?.email}</div>
            </div>
          )}
        </div>

        {/* Separated Action Controls (Darker Distinct Background) */}
        <div className={`flex items-center rounded-lg border border-border/60 bg-muted/70 dark:bg-muted/40 p-1 gap-1 ${(sidebarOpen || isDrawer) ? "justify-between" : "flex-col"}`}>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground size-7 rounded-md hover:bg-background/60 transition-colors"
            title={isDark ? "Modo Claro" : "Modo Escuro"}
          >
            {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </Button>

          <Button
            variant="ghost"
            size={(sidebarOpen || isDrawer) ? "sm" : "icon-xs"}
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-7 px-2.5 rounded-md transition-colors"
            title="Sair da Conta"
          >
            <LogOut className="size-3.5 shrink-0" />
            {(sidebarOpen || isDrawer) && <span className="ml-1 text-[11px] font-medium">Sair</span>}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* ── Desktop Sidebar (Linear Style) ── */}
      {!isMobile && (
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ${
            sidebarOpen ? "w-60" : "w-14"
          }`}
        >
          {renderSidebarNavigation(false)}
        </aside>
      )}

      {/* ── Main Content Area ── */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${!isMobile && sidebarOpen ? "md:ml-60" : !isMobile ? "md:ml-14" : ""}`}>
        
        {/* ── Top Dashboard Header (Linear Command Bar Style) ── */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-xl">
          {/* Left section: Breadcrumb / Mobile menu */}
          <div className="flex items-center gap-3">
            {isMobile && (
              <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
                <SheetTrigger render={<Button variant="ghost" size="icon-xs" className="size-8"><Menu className="size-4" /></Button>} />
                <SheetContent side="left" className="w-60 p-0 bg-card border-r border-border">
                  {renderSidebarNavigation(true)}
                </SheetContent>
              </Sheet>
            )}

            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
              <span>painel</span>
              <span className="text-muted-foreground/40">/</span>
              <span className="text-foreground font-semibold">
                {activeTab === "documents" && "peticoes"}
                {activeTab === "plans" && "planos"}
                {activeTab === "profile" && "perfil"}
              </span>
            </div>
          </div>

          {/* Right section: Shortcuts, Notifications, Profile Dropdown */}
          <div className="flex items-center gap-2">
            {/* Teclas de Atalho Button (Atalhos da dashboard) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShortcutsModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 border-border/70 bg-muted/30 text-muted-foreground hover:text-foreground h-7 px-2.5 text-xs rounded-md"
              title="Ver Teclas de Atalho (Alt+K ou ?)"
            >
              <Keyboard className="size-3 text-muted-foreground" />
              <span>Atalhos da dashboard</span>
              <kbd className="pointer-events-none ml-1 hidden h-4 select-none items-center rounded border border-border bg-card px-1 font-mono text-[9px] font-semibold text-muted-foreground sm:inline-flex">
                Alt K
              </kbd>
            </Button>

            {/* Notificações Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon-xs" className="relative text-muted-foreground hover:text-foreground size-8 rounded-md">
                  <Bell className="size-3.5" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-2 right-2 flex size-1.5 rounded-full bg-primary" />
                  )}
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-80 p-2 border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <DropdownMenuLabel className="font-bold text-xs p-0 text-foreground">
                    Avisos & Atualizações
                  </DropdownMenuLabel>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[10px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />
                <div className="space-y-1 py-1 max-h-72 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-2.5 rounded-lg text-xs transition-colors ${
                        notif.read ? "text-muted-foreground hover:bg-muted/40" : "bg-primary/5 text-foreground hover:bg-primary/10"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{notif.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono font-normal">{notif.time}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        {notif.description}
                      </p>
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Alternador de Tema */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground size-8 rounded-md"
              title={isDark ? "Modo Claro" : "Modo Escuro"}
            >
              {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </Button>

            {/* Profile Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <button className="flex items-center gap-1 rounded-full border border-border/80 p-0.5 hover:border-primary/50 transition-colors cursor-pointer outline-none">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold text-[9px]">
                      {profile?.name?.slice(0, 2).toUpperCase() || "ADV"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              } />
              <DropdownMenuContent align="end" className="w-56 border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl p-1.5">
                <DropdownMenuLabel className="px-2 py-1.5">
                  <div className="text-xs font-bold text-foreground">{profile?.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground font-normal truncate">{profile?.email}</div>
                  {profile?.oab && (
                    <Badge variant="outline" className="mt-1.5 border-primary/30 bg-primary/10 text-[9px] text-primary">
                      {profile.oab}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setActiveTab("profile")} className="cursor-pointer text-xs">
                    <User className="size-3.5 mr-2" />
                    <span>Meu Perfil & Segurança</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setActiveTab("plans")} className="cursor-pointer text-xs">
                    <Crown className="size-3.5 mr-2 text-primary" />
                    <span>Plano & Assinatura</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  variant="destructive"
                  className="cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="size-3.5 mr-2" />
                  <span>Sair da Conta</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── Main Dashboard Body ── */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {/* ════ TAB 1: MINHAS PETIÇÕES ════ */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              {/* Top Banner Greeting (Linear Style) */}
              <div className="border-b border-border/60 pb-4">
                <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  <span>Área de Trabalho Forense</span>
                  <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 border border-border/80 px-2 py-0.5 rounded-full font-normal">
                    {totalDocuments} peças
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gerenciador central de redação e exportação de petições iniciais.
                </p>
              </div>

              {/* Metric Counters (Linear Style minimal badges) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-md">
                  <div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider">Total Gerado</div>
                    <div className="mt-1 text-xl font-extrabold text-foreground">{totalDocuments}</div>
                  </div>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-md">
                  <div>
                    <div className="font-mono text-[10px] uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Finalizadas</div>
                    <div className="mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{completedDocuments}</div>
                  </div>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-md">
                  <div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground tracking-wider">Em Rascunho</div>
                    <div className="mt-1 text-xl font-extrabold text-muted-foreground">{draftDocuments}</div>
                  </div>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Clock className="size-4" />
                  </div>
                </div>
              </div>

              {/* Search & Filter Bar (Linear Style) */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Filtrar por título ou ação..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-card/60 border-border/70 rounded-lg"
                  />
                </div>

                <div className="flex rounded-lg border border-border/70 bg-card/40 p-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className={`text-[11px] h-7 px-2.5 rounded-md ${statusFilter === "all" ? "bg-muted text-foreground font-semibold shadow-xs" : "text-muted-foreground"}`}
                  >
                    Todas ({totalDocuments})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter("completed")}
                    className={`text-[11px] h-7 px-2.5 rounded-md ${statusFilter === "completed" ? "bg-muted text-foreground font-semibold shadow-xs" : "text-muted-foreground"}`}
                  >
                    Prontas ({completedDocuments})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter("draft")}
                    className={`text-[11px] h-7 px-2.5 rounded-md ${statusFilter === "draft" ? "bg-muted text-foreground font-semibold shadow-xs" : "text-muted-foreground"}`}
                  >
                    Rascunhos ({draftDocuments})
                  </Button>
                </div>
              </div>

              {/* Document Cards Grid (Linear Style) */}
              {loading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-36 animate-pulse rounded-xl border border-border/70 bg-card/40 p-4" />
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                    <FileText className="size-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-foreground">Nenhuma petição encontrada</h3>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    {searchQuery ? "Nenhum documento corresponde aos termos de busca." : "Comece fornecendo os fatos de um novo caso para gerar a peça inicial."}
                  </p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-4 bg-primary text-primary-foreground font-semibold text-xs h-8 px-3 rounded-lg"
                  >
                    <Plus className="size-3.5 mr-1" />
                    Nova Petição
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => router.push(`/editor?id=${doc.id}`)}
                      className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-4 backdrop-blur-md transition-all duration-200 hover:border-primary/50 hover:bg-card/90 hover:shadow-md cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 font-mono text-[9px] px-2 py-0.5 rounded-full ${
                            doc.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-border/60"
                          }`}>
                            <span className={`size-1.5 rounded-full ${doc.status === "completed" ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                            {doc.status === "completed" ? "Pronta" : "Rascunho"}
                          </span>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            disabled={deletingId === doc.id}
                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-6 rounded-md transition-opacity"
                            title="Excluir Petição"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>

                        <h3 className="line-clamp-2 mt-2.5 text-xs font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                          {doc.title}
                        </h3>
                      </div>

                      <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-muted-foreground border-t border-border/50 pt-2.5">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(doc.updated_at)}
                        </span>
                        <span className="flex items-center gap-0.5 font-sans font-semibold text-primary group-hover:underline">
                          Abrir <ChevronRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ TAB 2: PLANOS DE ASSINATURA ════ */}
          {activeTab === "plans" && (
            <div className="space-y-6">
              <div className="border-b border-border/60 pb-5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Planos & Assinatura</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Escolha o plano ideal para a escala de produção jurídica do seu escritório.
                </p>
              </div>

              {/* Status do Plano Atual (Linear Style) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                    <Crown className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">Plano Atual: {profile?.plan || "Pro Trial"}</span>
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">Ativo</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Franquia mensal: <strong className="text-foreground">{profile?.petitions_limit ?? 30} petições</strong> ({Math.max(0, (profile?.petitions_limit ?? 30) - (profile?.petitions_used ?? 0))} restantes neste ciclo)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:border-l sm:border-border/60 sm:pl-4">
                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-foreground">
                      {profile?.petitions_used ?? 0} / {profile?.petitions_limit ?? 30}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Petições Utilizadas</div>
                  </div>
                </div>
              </div>

              {/* Grade de Planos (Linear Style) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Individual */}
                <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-5 backdrop-blur-md">
                  <div>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase border border-border px-2 py-0.5 rounded-md">Individual</span>
                    <div className="mt-3 text-2xl font-extrabold">R$ 97<span className="text-xs text-muted-foreground font-normal">/mês</span></div>
                    <p className="mt-1.5 text-xs text-muted-foreground">Para advogados autônomos que buscam agilidade na rotina.</p>
                    
                    <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> 30 Petições por mês</li>
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Visual Law e formatação padrão</li>
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Exportação ilimitada (.docx)</li>
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Ditado por voz local</li>
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleOpenPixModal({
                      id: "individual",
                      name: "Individual",
                      price: 97.00,
                      description: "Plano Individual SmartDoc (30 Petições/mês)",
                    })}
                    className="mt-5 w-full text-xs h-9 border-border font-semibold hover:bg-muted/80 gap-1.5"
                  >
                    <Zap className="size-3.5 text-primary" />
                    <span>{profile?.plan === "Individual" ? "Renovar Individual (Pix)" : "Assinar Individual (Pix)"}</span>
                  </Button>
                </div>

                {/* Profissional (Destaque) */}
                <div className="relative flex flex-col justify-between rounded-xl border-2 border-primary bg-card/80 p-5 shadow-lg shadow-primary/5 backdrop-blur-md">
                  <div className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 font-mono text-[9px] font-bold text-primary-foreground uppercase">
                    Mais Popular
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-semibold">Profissional Pro</span>
                    <div className="mt-3 text-2xl font-extrabold text-foreground">R$ 197<span className="text-xs text-muted-foreground font-normal">/mês</span></div>
                    <p className="mt-1.5 text-xs text-muted-foreground">Para escritórios que exigem profundidade máxima e escala.</p>
                    
                    <ul className="mt-5 space-y-2 text-xs text-foreground font-medium">
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> <strong>Petições Ilimitadas</strong></li>
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Modelos jurídicos de raciocínio profundo</li>
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Reescrita inteligente via IA flutuante</li>
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Suporte prioritário via WhatsApp</li>
                    </ul>
                  </div>

                  <Button
                    onClick={() => handleOpenPixModal({
                      id: "pro",
                      name: "Profissional Pro",
                      price: 197.00,
                      description: "Plano Profissional Pro SmartDoc (Petições Ilimitadas)",
                    })}
                    className="mt-5 w-full text-xs h-9 bg-primary text-primary-foreground font-semibold shadow-xs hover:opacity-90 gap-1.5"
                  >
                    <Crown className="size-3.5" />
                    <span>{profile?.plan === "Profissional Pro" ? "Renovar Pro (Pix)" : "Assinar Profissional Pro (Pix)"}</span>
                  </Button>
                </div>

                {/* Escritório / Equipe */}
                <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-5 backdrop-blur-md">
                  <div>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase border border-border px-2 py-0.5 rounded-md">Boutique & Equipes</span>
                    <div className="mt-3 text-2xl font-extrabold">R$ 397<span className="text-xs text-muted-foreground font-normal">/mês</span></div>
                    <p className="mt-1.5 text-xs text-muted-foreground">Multi-usuários com centralização de documentos da banca.</p>
                    
                    <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Até 5 contas para advogados</li>
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Painel de gestão unificado</li>
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Modelos personalizados do escritório</li>
                      <li className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> Gerente de conta dedicado</li>
                    </ul>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleOpenPixModal({
                      id: "team",
                      name: "Boutique & Equipes",
                      price: 397.00,
                      description: "Plano Boutique & Equipes SmartDoc (Até 5 Contas)",
                    })}
                    className="mt-5 w-full text-xs h-9 border-border font-semibold hover:bg-muted/80 gap-1.5"
                  >
                    <Briefcase className="size-3.5 text-primary" />
                    <span>{profile?.plan === "Boutique & Equipes" ? "Renovar Equipes (Pix)" : "Assinar Equipes (Pix)"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 3: MEU PERFIL & SEGURANÇA (UNIFICADO & SIMÉTRICO) ════ */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="border-b border-border/60 pb-5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Meu Perfil & Segurança</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gerencie seus dados profissionais forenses e credenciais de acesso em um só lugar.
                </p>
              </div>

              {/* Grid Simétrica de Duas Colunas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna 1: Dados Profissionais & OAB */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <User className="size-4 text-primary" />
                    <span>Dados Profissionais</span>
                  </div>

                  {profileMsg && (
                    <div className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                      profileMsg.type === "success"
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border border-destructive/30 bg-destructive/10 text-destructive"
                    }`}>
                      {profileMsg.type === "success" ? <CheckCircle2 className="size-3.5 shrink-0" /> : <AlertCircle className="size-3.5 shrink-0" />}
                      <span>{profileMsg.text}</span>
                    </div>
                  )}

                  <div className="rounded-xl border border-border/70 bg-card/60 p-5 backdrop-blur-md">
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs font-medium">Nome Completo</Label>
                        <div className="relative flex items-center">
                          <User className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            id="name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Dr. Carlos Eduardo da Silva"
                            className="pl-8.5 h-8.5 text-xs bg-background/80"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="oab" className="text-xs font-medium">Número da OAB / Seccional</Label>
                        <div className="relative flex items-center">
                          <Briefcase className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            id="oab"
                            value={editOab}
                            onChange={(e) => setEditOab(e.target.value)}
                            placeholder="Ex: OAB/SP 123.456"
                            className="pl-8.5 h-8.5 text-xs bg-background/80"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-medium">E-mail de Acesso</Label>
                        <div className="relative flex items-center">
                          <Mail className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            id="email"
                            value={editEmail}
                            disabled
                            className="pl-8.5 h-8.5 text-xs bg-muted/40 cursor-not-allowed opacity-75"
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">E-mail primário vinculado à autenticação.</p>
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={profileSaving}
                          className="w-full bg-primary text-primary-foreground font-semibold shadow-xs hover:opacity-90 text-xs h-8.5 rounded-lg"
                        >
                          {profileSaving ? "Salvando..." : "Salvar Dados Profissionais"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Coluna 2: Segurança & Alteração de Senha */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <ShieldCheck className="size-4 text-primary" />
                    <span>Segurança & Senha</span>
                  </div>

                  {passMsg && (
                    <div className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                      passMsg.type === "success"
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border border-destructive/30 bg-destructive/10 text-destructive"
                    }`}>
                      {passMsg.type === "success" ? <CheckCircle2 className="size-3.5 shrink-0" /> : <AlertCircle className="size-3.5 shrink-0" />}
                      <span>{passMsg.text}</span>
                    </div>
                  )}

                  <div className="rounded-xl border border-border/70 bg-card/60 p-5 backdrop-blur-md">
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="newPass" className="text-xs font-medium">Nova Senha</Label>
                        <div className="relative flex items-center">
                          <KeyRound className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            id="newPass"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="pl-8.5 h-8.5 text-xs bg-background/80"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="confPass" className="text-xs font-medium">Confirmar Nova Senha</Label>
                        <div className="relative flex items-center">
                          <Shield className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            id="confPass"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="pl-8.5 h-8.5 text-xs bg-background/80"
                            required
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">Use caracteres especiais para maior segurança.</p>
                      </div>

                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={passSaving}
                          className="w-full bg-primary text-primary-foreground font-semibold shadow-xs hover:opacity-90 text-xs h-8.5 rounded-lg"
                        >
                          {passSaving ? "Atualizando..." : "Alterar Senha de Acesso"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog: Teclas de Atalho (shadcn Dialog) ── */}
      <Dialog open={isShortcutsModalOpen} onOpenChange={setIsShortcutsModalOpen}>
        <DialogContent className="max-w-sm border-border/80 bg-card/95 p-5 shadow-2xl rounded-2xl backdrop-blur-xl">
          <DialogHeader className="space-y-0.5">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <Keyboard className="size-3" />
              <span>Produtividade Forense</span>
            </div>
            <DialogTitle className="text-base font-bold tracking-tight text-foreground">
              Teclas de Atalho
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Comandos de teclado que não conflitam com seu navegador.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-1.5 space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-border/70 p-2 bg-muted/30">
              <span className="text-xs font-medium text-foreground">Criar Nova Petição</span>
              <div className="flex items-center gap-1">
                <kbd className="rounded border border-border/80 bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                  Alt + N
                </kbd>
                <span className="text-[10px] text-muted-foreground">ou</span>
                <kbd className="rounded border border-border/80 bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                  C
                </kbd>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/70 p-2 bg-muted/30">
              <span className="text-xs font-medium text-foreground">Janela de Atalhos</span>
              <div className="flex items-center gap-1">
                <kbd className="rounded border border-border/80 bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                  Alt + K
                </kbd>
                <span className="text-[10px] text-muted-foreground">ou</span>
                <kbd className="rounded border border-border/80 bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                  ?
                </kbd>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/70 p-2 bg-muted/30">
              <span className="text-xs font-medium text-foreground">Trocar Abas (Petições / Planos / Perfil)</span>
              <div className="flex items-center gap-1">
                <kbd className="rounded border border-border/80 bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                  1
                </kbd>
                <kbd className="rounded border border-border/80 bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                  2
                </kbd>
                <kbd className="rounded border border-border/80 bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                  3
                </kbd>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/70 p-2 bg-muted/30">
              <span className="text-xs font-medium text-foreground">Fechar Janelas / Modais</span>
              <kbd className="rounded border border-border/80 bg-card px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                Esc
              </kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Criar Nova Petição (Largura Ampliada Linear Style) ── */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl sm:max-w-4xl border-border/80 bg-card/95 p-6 sm:p-8 shadow-2xl rounded-2xl backdrop-blur-xl">
          <DialogHeader className="space-y-1">
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <FileText className="size-3" />
              <span>Inteligência Forense</span>
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Descreva o Caso do seu Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cole os fatos brutos, mensagens de WhatsApp ou dite a narrativa do caso. Nossa IA estruturará a Petição Inicial completa pronta para protocolo.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-1">
            <Label className="text-xs font-semibold text-foreground ml-1">Fatos Brutos</Label>
            <div className="relative">
              <textarea
                rows={9}
                value={modalText}
                onChange={(e) => setModalText(e.target.value)}
                placeholder="Ex: O autor celebrou contrato de compra e venda de imóvel na planta em janeiro de 2022 com entrega prevista para dezembro de 2023. A construtora atrasou injustificadamente além do prazo de tolerância de 180 dias. O autor sofreu danos materiais decorrentes de lucros cessantes e despesas com aluguel..."
                className="w-full rounded-xl border border-border/80 bg-background/80 p-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-none"
              />

              <button
                type="button"
                onClick={toggleDictation}
                className={`absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                  isDictating
                    ? "border-destructive bg-destructive/10 text-destructive animate-pulse"
                    : "border-border/80 bg-muted/70 text-muted-foreground hover:text-foreground"
                }`}
                title={isDictating ? "Parar Gravação" : "Ditar por Voz"}
              >
                <Mic className="size-4" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-[11px] text-muted-foreground">
                {modalText.length} caracteres
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-border/80 text-xs h-8.5 px-3 rounded-lg"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateDocument}
                  disabled={!modalText.trim() || isSubmitting}
                  className="bg-primary text-primary-foreground font-semibold shadow-xs hover:opacity-90 text-xs h-8.5 px-4 rounded-lg gap-1.5"
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
      {/* ── Dialog: Pagamento de Plano via Pix (Instantâneo com Webhook em Tempo Real) ── */}
      <Dialog open={isPixModalOpen} onOpenChange={setIsPixModalOpen}>
        <DialogContent className="max-w-lg border-border/80 bg-card p-6 shadow-2xl rounded-2xl">
          {pixLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <div className="text-sm font-semibold text-foreground">Gerando Cobrança Pix...</div>
              <p className="text-xs text-muted-foreground max-w-xs">
                Conectando ao gateway bancário GG Pix para emitir seu QR Code seguro.
              </p>
            </div>
          ) : pixError ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                <AlertCircle className="size-5" />
                <span>Falha ao gerar Pix</span>
              </div>
              <p className="text-xs text-muted-foreground">{pixError}</p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsPixModalOpen(false)}>
                  Fechar
                </Button>
                {selectedPlan && (
                  <Button size="sm" onClick={() => handleOpenPixModal(selectedPlan)}>
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </div>
          ) : pixSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 animate-bounce">
                <CheckCircle2 className="size-9" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Pagamento Confirmado!</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  O Webhook recebeu a confirmação do pagamento com sucesso. Seu plano <strong className="text-foreground">{selectedPlan?.name}</strong> já está ativo no seu painel.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  onClick={() => {
                    setIsPixModalOpen(false);
                    setActiveTab("documents");
                  }}
                  className="bg-primary text-primary-foreground font-semibold px-6 text-xs h-9 rounded-xl shadow-md hover:opacity-90"
                >
                  Ir para Minhas Petições
                </Button>
              </div>
            </div>
          ) : pixData ? (
            <div className="space-y-5">
              <DialogHeader className="space-y-1 text-left">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    <Zap className="size-3" />
                    <span>Pagamento Instantâneo via Pix</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs font-bold text-foreground bg-muted/60">
                    R$ {selectedPlan?.price?.toFixed(2).replace(".", ",")}/mês
                  </Badge>
                </div>
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  Assinatura {selectedPlan?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Abra o aplicativo do seu banco, escaneie o QR Code ou copie o código Pix abaixo.
                </DialogDescription>
              </DialogHeader>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
                <div className="p-3 bg-white rounded-xl shadow-xs border border-border/40">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pixData.pixCode)}&size=190x190`}
                    alt="QR Code Pix"
                    className="size-44 object-contain rounded"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                  <QrCode className="size-3.5 text-primary" />
                  <span>Aponte a câmera do seu aplicativo bancário</span>
                </div>
              </div>

              {/* Pix Copia e Cola Field */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Código Pix (Copia e Cola)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={pixData.pixCode}
                    className="font-mono text-[11px] bg-background select-all h-9"
                  />
                  <Button
                    type="button"
                    onClick={handleCopyPix}
                    className={`shrink-0 text-xs h-9 px-3 gap-1.5 font-semibold transition-all ${
                      copiedPix
                        ? "bg-emerald-600 text-white"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {copiedPix ? (
                      <>
                        <CheckCheck className="size-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Live Realtime Webhook Banner */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-center gap-2.5 text-xs text-foreground">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <div className="text-[11px] leading-relaxed text-muted-foreground">
                  <strong className="text-foreground font-semibold">Aguardando confirmação via Webhook:</strong> assim que você pagar no app do banco, seu plano será liberado automaticamente aqui em tempo real.
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ── Toast Flutuante de Pagamento Recebido (Linear / Modern Dark UI) ── */}
      {paymentToast?.show && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex w-full items-start gap-3 rounded-2xl border border-emerald-500/40 bg-card/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-emerald-500/20">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="size-5" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {paymentToast.title}
                </span>
                <span className="font-mono text-[10px] text-emerald-500 font-semibold">
                  Ao Vivo
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {paymentToast.message}
              </p>
              <div className="pt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Zap className="size-3" />
                  <span>Plano Ativo</span>
                </span>
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {paymentToast.time || "Agora"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setPaymentToast(null)}
              className="text-muted-foreground hover:text-foreground text-xs p-1 rounded-md transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
