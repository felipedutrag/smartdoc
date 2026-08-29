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

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching documents:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ documents: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro interno" }, { status: 500 });
  }
}

// POST /api/documents - Criar novo documento
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { title, action_type, facts, content_html, summary, status = "draft" } = body;

    // 1. Verificar saldo de créditos de petição do usuário
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, plan_status, petitions_limit, petitions_used")
      .eq("id", user.id)
      .maybeSingle();

    const limit = profile?.petitions_limit ?? 0;
    const used = profile?.petitions_used ?? 0;
    const available = Math.max(0, limit - used);

    // Trava de esgotamento de créditos
    if (available <= 0) {
      return NextResponse.json(
        {
          error: "Seus créditos de petição se esgotaram. Adquira um novo pacote de créditos para continuar gerando peças com IA.",
          code: "CREDITS_EXHAUSTED",
          credits: { used, limit, available: 0 },
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

    // 3. Incrementar contador de créditos utilizados
    await supabase
      .from("profiles")
      .update({
        petitions_used: used + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json(
      {
        document: data,
        credits: { used: used + 1, limit },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro interno" }, { status: 500 });
  }
}
