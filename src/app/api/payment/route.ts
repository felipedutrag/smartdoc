import { NextResponse } from "next/server";
import { sendTelegramNotification } from "@/lib/telegram";

const GGPIX_API_URL = "https://ggpixapi.com/api/v1/pix/in";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let price = body.price || 29.00;
    if (process.env.NODE_ENV === "development") {
      price = 1.00;
    }
    const amountCents = Math.round(price * 100);
    const externalId = `extrajus_${Date.now()}`;

    const response = await fetch(GGPIX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.GGPIX_API_KEY || "",
      },
      body: JSON.stringify({
        amountCents,
        description: "Liberação de Edição SmartDoc",
        payerName: "Cliente SmartDoc",
        payerDocument: "00000000000",
        externalId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro GG Pix:", data);
      return NextResponse.json({ error: "Falha ao gerar Pix" }, { status: 500 });
    }

    // Notificar via Telegram
    const formattedAmount = (amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    sendTelegramNotification(
      `#SISTEMA_ORDEM 💰 <b>PIX GERADO</b>\n\n` +
      `💵 Valor: <b>${formattedAmount}</b>\n` +
      `🔑 ID: <code>${externalId}</code>\n` +
      `🚀 Só falta pagar para o lucro entrar!`
    ).catch(console.error);

    return NextResponse.json({ 
      id: data.id,
      pixCode: data.pixCopyPaste, 
      pixQrCode: data.pixCode, // A API GG Pix costuma retornar a base64 ou link
      externalId 
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Billing Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
