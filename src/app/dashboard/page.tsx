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
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text-primary)", fontFamily: "var(--font-sans), sans-serif" }}>
      {/* Top Navigation */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: "1300px",
            margin: "0 auto",
            padding: isMobile ? "14px 16px" : "16px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link
              href="/dashboard"
              style={{
                fontSize: 20,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
                color: "inherit",
                position: "relative",
              }}
            >
              <span style={{ fontWeight: 700, letterSpacing: "-0.04em" }}>SMART</span>
              <span style={{ fontWeight: 900, color: "#d97706", letterSpacing: "-0.04em", marginLeft: 2 }}>DOC</span>
              <span
                style={{
                  marginLeft: 8,
                  background: "rgba(217, 119, 6, 0.15)",
                  border: "1px solid rgba(217, 119, 6, 0.3)",
                  color: "#d97706",
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "2px 6px",
                  borderRadius: "6px",
                }}
              >
                PRO
              </span>
            </Link>

            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "13px" }}>
                <span>Painel do Advogado</span>
              </div>
            )}
          </div>

          {/* Theme Toggle & User Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px" }}>
            {/* Theme Toggle Button */}
            <button
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
              style={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-primary)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#d97706")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Profile badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "6px 12px",
                borderRadius: "12px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #d97706, #92400e)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                {profile?.name ? profile.name.charAt(0).toUpperCase() : "A"}
              </div>

              {!isMobile && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.2 }}>
                    {profile?.name || "Advogado"}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.2 }}>
                    {profile?.oab ? profile.oab : profile?.email}
                  </span>
                </div>
              )}

              <button
                onClick={handleSignOut}
                title="Sair da Conta"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: "1300px", margin: "0 auto", padding: isMobile ? "20px 16px" : "32px 28px" }}>
        
        {/* Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {/* Total */}
          <div
            style={{
              padding: "20px",
              borderRadius: "16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total de Peças
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, marginTop: "4px" }}>
                {totalDocuments}
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                background: "rgba(217, 119, 6, 0.12)",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={22} />
            </div>
          </div>

          {/* Completed */}
          <div
            style={{
              padding: "20px",
              borderRadius: "16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Prontas / Finalizadas
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>
                {completedDocuments}
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={22} />
            </div>
          </div>

          {/* Drafts */}
          <div
            style={{
              padding: "20px",
              borderRadius: "16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Em Rascunho / Edição
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>
                {draftDocuments}
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                background: "rgba(245, 158, 11, 0.12)",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={22} />
            </div>
          </div>
        </div>

        {/* Section Header & Filters */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "stretch" : "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Suas Petições e Documentos
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "2px" }}>
              Gerencie, continue redigindo ou exporte suas peças processuais.
            </p>
          </div>

          {/* Filter tabs & Search Bar */}
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "10px" }}>
            {/* Search Input */}
            <div style={{ position: "relative", minWidth: isMobile ? "100%" : "260px" }}>
              <Search
                size={16}
                style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
              />
              <input
                type="text"
                placeholder="Buscar por título ou ação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 36px",
                  borderRadius: "10px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>

            {/* Filter buttons */}
            <div
              style={{
                display: "flex",
                background: "var(--surface)",
                padding: "3px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
              }}
            >
              {[
                { id: "all", label: "Todas" },
                { id: "completed", label: "Prontas" },
                { id: "draft", label: "Rascunhos" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "7px",
                    border: "none",
                    background: statusFilter === tab.id ? "var(--bg)" : "transparent",
                    color: statusFilter === tab.id ? "#d97706" : "var(--text-secondary)",
                    fontWeight: statusFilter === tab.id ? 700 : 500,
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action: Nova Petição Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "10px",
                background: "var(--surface)",
                border: "1.5px solid #d97706",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(217, 119, 6, 0.12)",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(217, 119, 6, 0.08)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>Nova Petição</span>
              <ArrowRight size={15} style={{ color: "#d97706" }} />
            </button>
          </div>
        </div>

        {/* Documents Grid / List */}
        {loading ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "var(--surface)",
              borderRadius: "16px",
              border: "1px solid var(--border)",
            }}
          >
            <div className="animate-spin" style={{ display: "inline-block", color: "#d97706", marginBottom: "12px" }}>
              <Clock size={32} />
            </div>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Carregando suas petições...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              background: "var(--surface)",
              borderRadius: "16px",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "16px",
                background: "rgba(217, 119, 6, 0.1)",
                color: "#d97706",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <FileText size={28} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>
              Nenhuma petição encontrada
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "400px", margin: "0 auto 20px" }}>
              {searchQuery
                ? "Nenhum documento corresponde ao termo de busca pesquisado."
                : "Você ainda não criou nenhuma peça. Comece a redigir sua primeira petição agora."}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 24px",
                borderRadius: "12px",
                background: "var(--surface)",
                border: "1.5px solid #d97706",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(217, 119, 6, 0.12)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(217, 119, 6, 0.08)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span>Criar Nova Petição</span>
              <ArrowRight size={16} style={{ color: "#d97706" }} />
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => router.push(`/editor?id=${doc.id}`)}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(217, 119, 6, 0.4)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Header: Action Type & Status Badge */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "#d97706",
                        background: "rgba(217, 119, 6, 0.1)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {doc.action_type || "Petição Inicial"}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {doc.status === "completed" ? (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#10b981",
                            background: "rgba(16, 185, 129, 0.1)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Pronta
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#f59e0b",
                            background: "rgba(245, 158, 11, 0.1)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <Clock size={12} />
                          Rascunho
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      lineHeight: 1.4,
                      marginBottom: "10px",
                      color: "var(--text-primary)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {doc.title || "Petição sem título"}
                  </h3>
                </div>

                {/* Footer: Date, Word count, Actions */}
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "14px",
                    marginTop: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  <div>
                    <span>{formatDate(doc.updated_at)}</span>
                    {doc.word_count > 0 && <span> • {doc.word_count} palavras</span>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      disabled={deletingId === doc.id}
                      title="Excluir Petição"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "6px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    >
                      <Trash2 size={15} />
                    </button>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        color: "#d97706",
                        fontWeight: 600,
                      }}
                    >
                      <span>Abrir</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modal de Nova Petição ── */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "16px",
          }}
          onClick={() => !isSubmitting && setIsModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "680px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    background: "rgba(217, 119, 6, 0.12)",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>
                    Nova Petição Inicial com IA
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                    Descreva os fatos ou clique em um dos modelos rápidos abaixo.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick chips */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 20px",
                background: "var(--chips-track-bg)",
                borderBottom: "1px solid var(--border)",
                overflowX: "auto",
                gap: "8px",
                scrollbarWidth: "none",
              }}
            >
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
                  style={{
                    padding: "5px 12px",
                    borderRadius: "999px",
                    background: "var(--chip-bg)",
                    border: "1px solid var(--chip-border)",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--text-primary)";
                    e.currentTarget.style.borderColor = "#d97706";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--text-muted)";
                    e.currentTarget.style.borderColor = "var(--chip-border)";
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Modal Body / Textarea */}
            <div style={{ padding: "20px 24px" }}>
              <textarea
                value={modalText}
                onChange={(e) => setModalText(e.target.value)}
                placeholder="Descreva detalhadamente os fatos do caso (ex: O autor celebrou contrato de locação com o réu em 10/01/2023 pelo valor mensal de R$ 3.500,00. Ocorre que o réu deixou de adimplir os aluguéis a partir de outubro de 2023...)"
                rows={6}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#d97706")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />

              {/* Action Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "16px",
                }}
              >
                <button
                  type="button"
                  onClick={toggleDictation}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    borderRadius: "99px",
                    background: isDictating ? "rgba(239, 68, 68, 0.15)" : "var(--bg)",
                    color: isDictating ? "#ef4444" : "var(--text-secondary)",
                    border: isDictating ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid var(--border)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Mic size={14} className={isDictating ? "animate-pulse" : ""} />
                  <span>{isDictating ? "Gravando voz..." : "Ditar por voz"}</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "10px",
                      background: "transparent",
                      border: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateDocument}
                    disabled={!modalText.trim() || isSubmitting}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "10px",
                      background: !modalText.trim() || isSubmitting ? "var(--border)" : "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: !modalText.trim() || isSubmitting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: modalText.trim() ? "0 4px 14px rgba(217, 119, 6, 0.3)" : "none",
                    }}
                  >
                    <span>{isSubmitting ? "Iniciando IA..." : "Gerar Petição"}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
