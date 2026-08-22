import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/user/profile - Retorna os dados do perfil do usuário autenticado
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
      // Fallback com dados do auth
      return NextResponse.json({
        profile: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || "Advogado(a)",
          oab: user.user_metadata?.oab || "",
        },
      });
    }

    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Erro interno" }, { status: 500 });
  }
}
