import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
        end_to_end_id: payload.endToEndId || null,
      });

      if (externalId) {
        query = query.eq("external_id", externalId);
      } else if (transactionId) {
        query = query.eq("ggpix_transaction_id", String(transactionId));
      }

      const { data: payment, error: updateErr } = await query.select().single();

      if (updateErr) {
        console.error("Erro ao atualizar pagamento no Supabase:", updateErr);
      }

      // Fallback para o usuário admin (felipedutra@outlook.com) caso seja um teste da GG Pix ou transação sem vínculo prévio
      const ADMIN_FALLBACK_USER_ID = "b052ac7c-76f1-4184-9422-3ae26b6e26e5"; // felipedutra@outlook.com
      const targetUserId = payment?.user_id || ADMIN_FALLBACK_USER_ID;

      // Determinar plano a ser ativado
      let planToActivate = "Profissional Pro";
      if (externalId && typeof externalId === "string") {
        if (externalId.includes("individual")) {
          planToActivate = "Individual";
        } else if (externalId.includes("team")) {
          planToActivate = "Boutique & Equipes";
        } else if (externalId.includes("pro")) {
          planToActivate = "Profissional Pro";
        }
      } else if (payload.amount) {
        if (payload.amount === 9700) planToActivate = "Individual";
        else if (payload.amount === 39700) planToActivate = "Boutique & Equipes";
        else if (payload.amount === 19700) planToActivate = "Profissional Pro";
      }

      // Ativar Plano do Usuário (seja o dono da transação ou o admin de fallback)
      if (targetUserId) {
        // 1. Atualizar user_metadata no Supabase Auth (funciona nativamente sempre)
        try {
          await supabase.auth.admin.updateUserById(targetUserId, {
            user_metadata: { plan: planToActivate, plan_status: "active" }
          });
        } catch (authErr) {
          console.error("Erro ao atualizar user_metadata no Auth:", authErr);
        }

        // 2. Atualizar tabela profiles (se a coluna plan existir no banco)
        try {
          await supabase
            .from("profiles")
            .update({
              plan: planToActivate,
              updated_at: new Date().toISOString(),
            })
            .eq("id", targetUserId);
        } catch (profileErr) {
          console.warn("Aviso ao atualizar profiles:", profileErr);
        }

        console.log(`Plano ${planToActivate} ativado com sucesso para o usuário ${targetUserId} (felipedutra@outlook.com)`);
      }

      // Liberar documento avulso se houver
      if (payment?.document_id) {
        await supabase
          .from("documents")
          .update({ is_paid: true })
          .eq("id", payment.document_id);
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
