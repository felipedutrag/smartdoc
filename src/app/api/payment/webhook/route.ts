import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    console.log("GG Pix Webhook payload:", payload);

    // Identificar external_id ou transaction_id
    const externalId = payload.externalId || payload.external_id || payload.data?.externalId;
    const status = payload.status || payload.event || payload.data?.status;

    if (!externalId) {
      return NextResponse.json({ error: "External ID not found" }, { status: 400 });
    }

    if (status === "PAID" || status === "COMPLETE" || status === "COMPLETED" || status === "payment.succeeded") {
      const supabase = createAdminClient();

      // Atualizar pagamento
      const { data: payment } = await supabase
        .from("payments")
        .update({
          status: "PAID",
          paid_at: new Date().toISOString(),
        })
        .eq("external_id", externalId)
        .select()
        .single();

      // Liberar documento se houver
      if (payment?.document_id) {
        await supabase
          .from("documents")
          .update({ is_paid: true })
          .eq("id", payment.document_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
