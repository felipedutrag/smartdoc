import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentSuccessEmail } from "@/lib/email";
import crypto from "crypto";

function validateWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  try {
    const parts = signature.split(",");
    const timestamp = parts[0]?.replace("t=", "") || "";
    const receivedSig = parts[1]?.replace("v1=", "") || "";
    
    // Verificar se não é replay attack (máximo 5 min = 300s)
    const age = Date.now() / 1000 - parseInt(timestamp, 10);
    if (age > 300) return false;

    // Assinatura esperada: HMAC-SHA256(timestamp.rawBody)
    const signedPayload = timestamp + "." + rawBody;
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(receivedSig),
      Buffer.from(expectedSig)
    );
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "GG Pix Webhook endpoint is active and listening for POST callbacks.",
  });
}

export async function POST(request: Request) {
  console.log("===> [WEBHOOK INCOMING] Recebida chamada POST no webhook");
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature");
    const authHeader = request.headers.get("authorization");

    console.log("===> [WEBHOOK BODY]:", rawBody);

    // 1. Validação por Bearer Token no Header de Autorização
    const expectedBearer = process.env.GGPIX_BEARER_TOKEN || "83380259fd8ead3107b71f27e2c8f7ab4d22528bbe3e6f102c8014b48baecd98";
    if (expectedBearer && authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (token !== expectedBearer) {
        console.warn("Webhook: Bearer token inválido. Recebido:", token);
        return NextResponse.json({ error: "Invalid Bearer Token" }, { status: 401 });
      }
    }

    // 2. Validação opcional por Assinatura HMAC (se configurado na env)
    if (process.env.GGPIX_WEBHOOK_SECRET && signature) {
      const isValid = validateWebhookSignature(rawBody, signature, process.env.GGPIX_WEBHOOK_SECRET);
      if (!isValid) {
        console.warn("Webhook: Assinatura HMAC inválida.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    console.log("GG Pix Webhook recebido:", JSON.stringify(payload));

    // Identificar external_id ou transaction_id
    const externalId = payload.externalId || payload.external_id || payload.data?.externalId;
    const transactionId = payload.transactionId || payload.id || payload.data?.id;
    const status = payload.status || payload.event || payload.data?.status;
    const eventType = payload.type || payload.eventType || "PIX_IN";

    if (!externalId && !transactionId) {
      return NextResponse.json({ error: "External ID ou Transaction ID não encontrado" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 3. Processar Confirmação de Pagamento
    if (status === "COMPLETE" || status === "PAID" || status === "COMPLETED" || status === "payment.succeeded") {
      let query = supabase.from("payments").update({
        status: "PAID",
        paid_at: payload.paidAt || new Date().toISOString(),
        payer_name: payload.payer?.name || null,
        payer_document: payload.payer?.document || null,
      });

      if (externalId) {
        query = query.eq("external_id", externalId);
      } else if (transactionId) {
        query = query.eq("ggpix_transaction_id", String(transactionId));
      }

      let paymentRecord = null;
      try {
        const { data } = await query.select().maybeSingle();
        paymentRecord = data;
      } catch (err) {
        console.warn("Aviso ao buscar transação existente:", err);
      }

      // Fallback para o usuário admin (felipedutra@outlook.com) caso seja um teste da GG Pix ou transação avulsa
      const ADMIN_FALLBACK_USER_ID = "b052ac7c-76f1-4184-9422-3ae26b6e26e5"; // felipedutra@outlook.com
      const targetUserId = paymentRecord?.user_id || ADMIN_FALLBACK_USER_ID;

      // Se a transação não existia previamente no banco (ex: teste manual do painel da GG Pix), registrar agora
      if (!paymentRecord && (externalId || transactionId)) {
        try {
          await supabase.from("payments").insert({
            user_id: targetUserId,
            external_id: externalId || String(transactionId),
            ggpix_transaction_id: transactionId ? String(transactionId) : null,
            amount_cents: payload.amount ? Math.round(payload.amount * 100) : 100,
            status: "PAID",
            payer_name: payload.payer?.name || "Teste Painel GG Pix",
            paid_at: payload.paidAt || new Date().toISOString(),
          });
        } catch (insertErr) {
          console.warn("Aviso ao registrar pagamento de teste:", insertErr);
        }
      }

      // Determinar pacote de créditos adquirido
      let creditsToAdd = 30;
      let packName = "Pacote Profissional (30 Petições)";

      const paidAmount = payload.amount ? Math.round(payload.amount * 100) : (paymentRecord?.amount_cents || 9700);

      if (
        (externalId && (externalId.includes("pack_10") || externalId.includes("start") || externalId.includes("pack_start"))) ||
        paidAmount === 4700 || payload.amount === 47 || paidAmount === 500 || payload.amount === 5 || paidAmount === 100 || payload.amount === 1 || paidAmount === 4700 || payload.amount === 47
      ) {
        creditsToAdd = 10;
        packName = "Pacote Inicial (10 Petições)";
      } else if (
        (externalId && (externalId.includes("pack_80") || externalId.includes("office") || externalId.includes("pack_office"))) ||
        paidAmount === 19700 || payload.amount === 197
      ) {
        creditsToAdd = 80;
        packName = "Pacote Escritório (80 Petições)";
      } else if (
        (externalId && (externalId.includes("pack_200") || externalId.includes("elite") || externalId.includes("pack_elite"))) ||
        paidAmount === 34700 || payload.amount === 347
      ) {
        creditsToAdd = 200;
        packName = "Pacote Elite (200 Petições)";
      } else {
        // Padrão ou R$ 97
        creditsToAdd = 30;
        packName = "Pacote Profissional (30 Petições)";
      }

      // Ativar / Adicionar Créditos ao Usuário
      if (targetUserId) {
        // 1. Atualizar user_metadata no Supabase Auth
        try {
          await supabase.auth.admin.updateUserById(targetUserId, {
            user_metadata: { plan: packName, plan_status: "active" }
          });
        } catch (authErr) {
          console.error("Erro ao atualizar user_metadata no Auth:", authErr);
        }

        // 2. Adicionar créditos de forma cumulativa na tabela profiles
        try {
          const { data: currentProfile } = await supabase
            .from("profiles")
            .select("petitions_limit, petitions_used")
            .eq("id", targetUserId)
            .maybeSingle();

          const currentLimit = currentProfile?.petitions_limit ?? 0;
          const newLimit = currentLimit + creditsToAdd;

          await supabase
            .from("profiles")
            .update({
              plan: packName,
              plan_status: "active",
              petitions_limit: newLimit,
              updated_at: new Date().toISOString(),
            })
            .eq("id", targetUserId);

          console.log(`[WEBHOOK] Adicionados +${creditsToAdd} créditos para o usuário ${targetUserId}. Novo total: ${newLimit} créditos.`);
        } catch (profileErr) {
          console.warn("Aviso ao atualizar profiles:", profileErr);
        }

        // 3. Enviar e-mail de confirmação de pagamento via Resend
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
          const userEmail = userData?.user?.email || paymentRecord?.payer_email || payload.payer?.email;
          const userName = userData?.user?.user_metadata?.name || paymentRecord?.payer_name || payload.payer?.name || "Doutor(a)";
          const amountCents = payload.amount ? Math.round(payload.amount * 100) : (paymentRecord?.amount_cents || 19700);

          if (userEmail) {
            sendPaymentSuccessEmail({
              email: userEmail,
              name: userName,
              planName: packName,
              amountCents,
              externalId: externalId || paymentRecord?.external_id,
            }).catch((e) => console.error("[WEBHOOK] Erro no envio de e-mail de pagamento:", e));
          }
        } catch (mailErr) {
          console.error("[WEBHOOK] Falha ao disparar e-mail de pagamento:", mailErr);
        }
      }

      // Liberar documento avulso se houver
      if (paymentRecord?.document_id) {
        await supabase
          .from("documents")
          .update({ is_paid: true })
          .eq("id", paymentRecord.document_id);
      }
    } else if (status === "FAILED" || status === "CANCELED") {
      let query = supabase.from("payments").update({
        status: status,
      });

      if (externalId) {
        query = query.eq("external_id", externalId);
      } else if (transactionId) {
        query = query.eq("ggpix_transaction_id", String(transactionId));
      }

      await query;
      console.log(`Pagamento ${externalId || transactionId} marcado como ${status}. Motivo:`, payload.failureReason);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
