import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const externalId = searchParams.get("externalId");

    if (!externalId && !id) {
      return NextResponse.json({ error: "ID externo ou ID da transação ausente" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Verificar primeiro no banco de dados
    let paymentRecord: any = null;
    if (externalId) {
      const { data } = await supabase
        .from("payments")
        .select("*, documents(id, is_paid)")
        .eq("external_id", externalId)
        .single();
      paymentRecord = data;
    }

    if (paymentRecord && paymentRecord.status === "PAID") {
      return NextResponse.json({ status: "COMPLETE", paid: true });
    }

    // 2. Consultar a API do GG Pix caso ainda esteja pendente
    if (id) {
      const ggResponse = await fetch(`https://ggpixapi.com/api/v1/transactions/${id}`, {
        method: "GET",
        headers: {
          "X-API-Key": process.env.GGPIX_API_KEY || "",
        },
      });
      
      if (ggResponse.ok) {
        const ggData = await ggResponse.json();
        if (ggData.status === "COMPLETE" || ggData.status === "PAID") {
          // Atualizar banco de dados
          if (externalId) {
            await supabase
              .from("payments")
              .update({
                status: "PAID",
                paid_at: new Date().toISOString(),
              })
              .eq("external_id", externalId);

            if (paymentRecord?.document_id) {
              await supabase
                .from("documents")
                .update({ is_paid: true })
                .eq("id", paymentRecord.document_id);
            }
          }

          return NextResponse.json({ status: "COMPLETE", paid: true });
        }
      } else {
        console.error("Erro ao consultar status na GG Pix:", await ggResponse.text().catch(() => ""));
      }
    }

    return NextResponse.json({ status: "PENDING", paid: false });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Status Check Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
