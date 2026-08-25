import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }

    const trimmedEmail = email.trim();
    const supabaseAdmin = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://smartdoc.work";

    // Gera o link seguro de recuperação via Supabase Admin
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: trimmedEmail,
      options: {
        redirectTo: `${appUrl}/login?mode=reset`,
      },
    });

    if (error) {
      console.warn("[RECOVERY] Aviso ao gerar link de recuperação no Supabase:", error.message);
      // Retornar sucesso genérico para segurança contra enumeração de e-mails
      return NextResponse.json({
        success: true,
        message: "Se o e-mail estiver cadastrado, as instruções foram enviadas.",
      });
    }

    const resetUrl = data?.properties?.action_link;
    const user = data?.user;
    const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Advogado(a)";

    if (resetUrl) {
      const emailResult = await sendPasswordResetEmail({
        email: trimmedEmail,
        name: userName,
        resetUrl,
      });

      if (!emailResult.success) {
        console.error("[RECOVERY] Falha no envio do e-mail pelo Resend:", emailResult.error);
        return NextResponse.json({ error: "Falha ao despachar o e-mail de recuperação." }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: "E-mail de recuperação enviado com sucesso!",
    });
  } catch (err: any) {
    console.error("[RECOVERY] Erro na rota de recuperação:", err);
    return NextResponse.json({ error: err?.message || "Erro ao processar solicitação." }, { status: 500 });
  }
}
