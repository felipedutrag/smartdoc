"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCcw, Search, Scale, ChevronDown, ChevronUp, Loader2, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

export function ProcessosClient() {
  const [processos, setProcessos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [numero, setNumero] = useState("");
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchProcessos = async () => {
    setLoading(true);
    const { data: userResponse } = await supabase.auth.getUser();
    if (!userResponse?.user) {
      setLoading(false);
      return;
    }
    
    const { data } = await supabase
      .from("processos")
      .select(`*, movimentacoes_processuais(id, data_movimentacao, descricao)`)
      .eq("user_id", userResponse.user.id)
      .order("ultima_atualizacao", { ascending: false });

    if (data) {
      const formatados = data.map((p: any) => ({
        ...p,
        movimentacoes_processuais: (p.movimentacoes_processuais || []).slice(0, 15)
      }));
      setProcessos(formatados);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProcessos();
  }, []);

  const formatNumero = (val: string) => {
    let clean = val.replace(/\D/g, "");
    if (clean.length > 20) clean = clean.substring(0, 20);
    let formatted = clean;
    if (clean.length > 7) formatted = clean.replace(/^(\d{7})(\d)/, "$1-$2");
    if (clean.length > 9) formatted = formatted.replace(/^(\d{7}-\d{2})(\d)/, "$1.$2");
    if (clean.length > 13) formatted = formatted.replace(/^(\d{7}-\d{2}\.\d{4})(\d)/, "$1.$2");
    if (clean.length > 14) formatted = formatted.replace(/^(\d{7}-\d{2}\.\d{4}\.\d{1})(\d)/, "$1.$2");
    if (clean.length > 16) formatted = formatted.replace(/^(\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2})(\d)/, "$1.$2");
    return formatted;
  };

  const handleSync = async (numero_processo: string, processo_id?: string) => {
    if (numero_processo.replace(/\D/g, "").length !== 20) {
      setErrorMessage("O número deve ter 20 dígitos (Padrão CNJ)");
      return;
    }
    setErrorMessage(null);
    setIsSyncing(processo_id || numero_processo);
    try {
      const res = await fetch("/api/processos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero_processo, processo_id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao sincronizar");
      await fetchProcessos();
      setNumero("");
    } catch (e: any) {
      setErrorMessage(e.message || "Erro ao consultar tribunal");
    } finally {
      setIsSyncing(null);
    }
  };

  const handleDeleteProcesso = async (processoId: string) => {
    if (!confirm("Tem certeza que deseja remover este processo do acompanhamento?")) {
      return;
    }
    setDeletingId(processoId);
    try {
      const { error } = await supabase.from("processos").delete().eq("id", processoId);
      if (error) throw error;
      setProcessos((prev) => prev.filter((p) => p.id !== processoId));
    } catch (err: any) {
      alert("Erro ao excluir processo: " + (err.message || "Tente novamente"));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 w-full">
      <Card className="bg-card/60 backdrop-blur border-border/60">
        <CardHeader>
          <CardTitle>Adicionar Processo</CardTitle>
          <CardDescription>Insira o número padrão CNJ para iniciar a raspagem no tribunal (Suporte: e-SAJ, e-Proc)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="0000000-00.0000.0.00.0000"
                className="pl-10 font-mono"
                value={numero}
                onChange={(e) => setNumero(formatNumero(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSync(numero);
                }}
              />
            </div>
            <Button disabled={isSyncing === numero || numero.replace(/\D/g,"").length !== 20} onClick={() => handleSync(numero)} className="w-full sm:w-auto">
              {isSyncing === numero ? (
                <RefreshCcw className="size-4 mr-2 animate-spin" />
              ) : (
                <Plus className="size-4 mr-2" />
              )}
              {isSyncing === numero ? "Buscando..." : "Adicionar Processo"}
            </Button>
          </div>
          {errorMessage && (
            <p className="text-xs text-destructive mt-2 font-medium">{errorMessage}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center p-12 bg-card/60 rounded-xl border border-dashed flex justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : processos.length === 0 ? (
          <div className="text-center p-12 bg-card/60 rounded-xl border border-dashed border-border/60">
            <Scale className="size-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-medium text-foreground">Nenhum processo monitorado</h3>
            <p className="text-sm text-muted-foreground">Adicione um número CNJ acima para começar.</p>
          </div>
        ) : (
          processos.map((p) => {
            const ultimaMov = p.movimentacoes_processuais?.[0];
            return (
              <Card key={p.id} className="overflow-hidden bg-card/60 backdrop-blur border-border/60 shadow-sm">
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-lg text-foreground">{p.numero_processo}</span>
                        <Badge variant="secondary" className="bg-muted border-border/60">{p.tribunal}</Badge>
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none font-medium">{p.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1"><span className="font-semibold text-foreground/80">Partes:</span> {p.partes}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1"><span className="font-semibold text-foreground/80">Assunto:</span> {p.assunto}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                      <Button variant="outline" size="sm" className="flex-1 md:flex-none border-border/60" onClick={() => toggleExpand(p.id)}>
                        {expanded[p.id] ? "Recolher Histórico" : "Ver Todas"}
                        {expanded[p.id] ? <ChevronUp className="size-4 ml-2"/> : <ChevronDown className="size-4 ml-2"/>}
                      </Button>
                      <Button size="sm" variant="secondary" className="px-3 bg-muted border border-border/60" disabled={isSyncing === p.id} onClick={() => handleSync(p.numero_processo, p.id)} title="Sincronizar Andamentos">
                        <RefreshCcw className={`size-4 ${isSyncing === p.id ? "animate-spin text-primary" : "text-muted-foreground"}`} />
                      </Button>
                      <Button size="sm" variant="ghost" className="px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/60" disabled={deletingId === p.id} onClick={() => handleDeleteProcesso(p.id)} title="Excluir do Acompanhamento">
                        {deletingId === p.id ? <Loader2 className="size-4 animate-spin text-destructive" /> : <Trash2 className="size-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* ÚLTIMA MOVIMENTAÇÃO SEMPRE VISÍVEL */}
                  {ultimaMov ? (
                    <div className="bg-muted/40 border border-border/50 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full shrink-0">
                          <Clock className="size-3" /> Último Andamento
                        </span>
                        <span className="text-xs text-foreground/90 font-medium truncate">
                          <span className="font-semibold text-foreground">{ultimaMov.data_movimentacao}:</span> {ultimaMov.descricao}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        Sync: {new Date(p.ultima_atualizacao).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded border border-border/30">
                      Nenhuma movimentação registrada até o momento.
                    </div>
                  )}
                </div>

                {/* HISTÓRICO COMPLETO EXPANSÍVEL */}
                {expanded[p.id] && (
                  <div className="bg-muted/20 border-t border-border/60 p-5">
                    <h4 className="font-semibold text-sm mb-4 text-foreground/80 flex items-center gap-2">
                      <RefreshCcw className="size-3.5 text-primary" /> Histórico Completo de Andamentos
                    </h4>
                    <div className="relative border-l-2 border-border/80 ml-3 space-y-5">
                      {p.movimentacoes_processuais?.length > 0 ? (
                        p.movimentacoes_processuais.map((m: any, idx: number) => (
                          <div key={idx} className="relative pl-6">
                            <div className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-4 ring-muted ${idx === 0 ? "bg-primary" : "bg-muted-foreground/40"}`}></div>
                            <div className="text-xs font-semibold text-foreground/80 mb-0.5">{m.data_movimentacao}</div>
                            <div className="text-xs text-muted-foreground bg-background/60 border border-border/40 p-2.5 rounded-md shadow-sm">{m.descricao}</div>
                          </div>
                        ))
                      ) : (
                        <div className="pl-6 text-sm text-muted-foreground">Nenhuma movimentação registrada.</div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
