import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/documents - Listar documentos do usuário logado
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = supabase
      .from("documents")
      .select("id, title, summary, action_type, status, is_paid, word_count, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%,action_type.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching documents:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data || [] });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}

// POST /api/documents - Criar novo rascunho de petição e debitar créditos com suporte a reset mensal e avulsos
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { title, action_type, facts, content_html, summary, status = "draft" } = body;

    // 1. Verificar perfil e créditos
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_status, petitions_limit, petitions_used, extra_credits, credits_reset_at")
      .eq("id", user.id)
      .maybeSingle();

    let limit = profile?.petitions_limit ?? 15;
    let used = profile?.petitions_used ?? 0;
    let extra = profile?.extra_credits ?? 0;
    const resetAt = profile?.credits_reset_at ? new Date(profile.credits_reset_at) : null;

    // Auto-reset se a data mensal venceu
    if (resetAt && resetAt <= new Date()) {
      used = 0;
      await supabase
        .from("profiles")
        .update({
          petitions_used: 0,
          credits_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", user.id);
    }

    const monthlyAvailable = Math.max(0, limit - used);
    const totalAvailable = monthlyAvailable + extra;

    // Trava de esgotamento de créditos
    if (totalAvailable <= 0) {
      return NextResponse.json(
        {
          error: "Seus créditos de petição se esgotaram. Renove seu plano mensal ou adquira um pacote avulso para continuar gerando peças com IA.",
          code: "CREDITS_EXHAUSTED",
          credits: { used, limit, extra, available: 0 },
        },
        { status: 403 }
      );
    }

    // 2. Inserir documento
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        title: title || "Petição Inicial sem Título",
        action_type: action_type || "Petição Inicial",
        facts: facts || "",
        summary: summary || null,
        content_html: content_html || "",
        status,
        word_count: content_html ? content_html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length : 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating document:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Debitar crédito: primeiro consome do limite mensal; se esgotado, consome do saldo avulso
    if (monthlyAvailable > 0) {
      await supabase
        .from("profiles")
        .update({
          petitions_used: used + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    } else {
      await supabase
        .from("profiles")
        .update({
          extra_credits: Math.max(0, extra - 1),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    return NextResponse.json(
      {
        document: data,
        credits: { used: used + 1, limit, extra: monthlyAvailable > 0 ? extra : Math.max(0, extra - 1) },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
