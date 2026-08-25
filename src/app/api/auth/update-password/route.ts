import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { password, accessToken } = await request.json();

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "A nova senha deve conter no mínimo 6 caracteres." }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    if (accessToken) {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
      
      if (userError || !user) {
        return NextResponse.json({ error: "Token de recuperação inválido ou expirado. Por favor, solicite um novo link." }, { status: 401 });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: password,
      });

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Senha atualizada com sucesso!" });
    }

    return NextResponse.json({ error: "Token de acesso não encontrado." }, { status: 400 });
  } catch (err: any) {
    console.error("Update password API error:", err);
    return NextResponse.json({ error: err?.message || "Erro ao atualizar senha." }, { status: 500 });
  }
}
