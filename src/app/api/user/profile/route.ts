import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/user/profile - Retorna os dados do perfil do usuário autenticado com auto-reset mensal
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({
        profile: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || "Advogado(a)",
          oab: user.user_metadata?.oab || "",
          plan: "Plano Start Mensal",
          petitions_limit: 15,
          petitions_used: 0,
          extra_credits: 0,
        },
      });
    }

    // Auto-reset mensal de créditos se os 30 dias tiverem expirado
    if (profile && profile.credits_reset_at && new Date(profile.credits_reset_at) <= new Date()) {
      const nextReset = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from("profiles")
        .update({
          petitions_used: 0,
          credits_reset_at: nextReset,
        })
        .eq("id", user.id);
      profile.petitions_used = 0;
      profile.credits_reset_at = nextReset;
    }

    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro interno" }, { status: 500 });
  }
}
