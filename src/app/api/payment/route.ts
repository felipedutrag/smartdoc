import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GGPIX_API_URL = "https://ggpixapi.com/api/v1/pix/in";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let price = body.price || 29.00;
    if (process.env.NODE_ENV === "development") {
      price = 1.00;
    }
    const amountCents = Math.round(price * 100);
    const externalId = `smartdoc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const documentId = body.documentId || null;

    // Obter usuário se autenticado
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {}

    const response = await fetch(GGPIX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.GGPIX_API_KEY || "",
      },
      body: JSON.stringify({
        amountCents,
        description: "Liberação de Edição SmartDoc",
        payerName: body.customerName || "Cliente SmartDoc",
        payerDocument: "00000000000",
        externalId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro GG Pix:", data);
      return NextResponse.json({ error: "Falha ao gerar Pix" }, { status: 500 });
    }

    // Salvar transação no banco de dados do Supabase
    try {
      const supabase = await createClient();
      await supabase.from("payments").insert({
        user_id: userId,
        document_id: documentId,
        external_id: externalId,
        ggpix_transaction_id: data.id ? String(data.id) : null,
        amount_cents: amountCents,
        status: "PENDING",
        pix_copy_paste: data.pixCopyPaste || "",
        payer_name: body.customerName || "",
        payer_email: body.customerEmail || "",
      });
    } catch (dbErr) {
      console.error("Erro ao registrar pagamento no Supabase:", dbErr);
    }

    return NextResponse.json({ 
      id: data.id,
      pixCode: data.pixCopyPaste, 
      pixQrCode: data.pixCode,
      externalId 
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Billing Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
