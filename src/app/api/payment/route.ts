import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GGPIX_API_URL = "https://ggpixapi.com/api/v1/pix/in";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const planId = body.planId || null;
    const planName = body.planName || null;
    const documentId = body.documentId || null;

    let price = body.price;
    if (price === undefined || price === null) {
      price = 29.00;
    }
    
    // Suporte a ambiente de desenvolvimento para testes de R$ 1,00 se configurado
    if (process.env.NODE_ENV === "development" && body.testMode) {
      price = 1.00;
    }

    const amountCents = Math.round(price * 100);
    const prefix = planId ? `smartdoc_plan_${planId}` : `smartdoc_doc`;
    const externalId = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Obter usuário se autenticado
    let userId: string | null = null;
    let userName: string = body.customerName || "Advogado(a) SmartDoc";
    let userEmail: string = body.customerEmail || "";

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        if (!body.customerName && user.user_metadata?.name) {
          userName = user.user_metadata.name;
        }
        if (!body.customerEmail && user.email) {
          userEmail = user.email;
        }
      }
    } catch {}

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://smartdoc.work";
    const webhookUrl = `${appUrl}/api/payment/webhook`;
    const description = body.description || (planName ? `Assinatura ${planName} - SmartDoc` : "SmartDoc - Tecnologia Jurídica com IA");

    const payloadGG: Record<string, any> = {
      amountCents,
      description,
      payerName: userName,
      payerDocument: body.customerDocument || "00000000000",
      externalId,
      webhookUrl,
    };

    const response = await fetch(GGPIX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.GGPIX_API_KEY || "",
        "Authorization": `Bearer ${process.env.GGPIX_BEARER_TOKEN || "83380259fd8ead3107b71f27e2c8f7ab4d22528bbe3e6f102c8014b48baecd98"}`,
      },
      body: JSON.stringify(payloadGG),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro GG Pix:", data);
      return NextResponse.json({ error: data?.message || data?.error || "Falha ao gerar Pix na GG Pix" }, { status: 500 });
    }

    // Salvar transação no banco de dados do Supabase usando Admin Client (bypassa RLS)
    try {
      const supabaseAdmin = createAdminClient();
      const insertData: Record<string, any> = {
        user_id: userId,
        document_id: documentId,
        external_id: externalId,
        ggpix_transaction_id: data.id ? String(data.id) : null,
        amount_cents: amountCents,
        status: "PENDING",
        pix_copy_paste: data.pixCopyPaste || data.pixCode || "",
        payer_name: userName,
        payer_email: userEmail,
      };

      const { error: insertErr } = await supabaseAdmin.from("payments").insert(insertData);
      if (insertErr) {
        console.error("Erro ao registrar pagamento no Supabase:", insertErr);
      } else {
        console.log("Pagamento registrado com sucesso no Supabase:", externalId);
      }
    } catch (dbErr) {
      console.error("Erro ao registrar pagamento no Supabase:", dbErr);
    }

    return NextResponse.json({ 
      id: data.id,
      pixCode: data.pixCopyPaste || data.pixCode, 
      pixQrCode: data.pixCode || data.pixCopyPaste,
      externalId,
      amount: price,
      amountCents,
      planName: planName || "Edição SmartDoc"
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Billing Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
