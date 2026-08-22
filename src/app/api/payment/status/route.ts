import { NextResponse } from "next/server";

// Simulação de um "banco de dados em memória" para o MVP.
// Em produção, isso seria substituído por uma consulta ao seu banco de dados (ex: Supabase).
// Como você mencionou que configurará o webhook depois, este endpoint servirá para 
// o polling consultar o status de um 'externalId'.

// Nota de Dev: Como não temos um DB conectado ainda, o status será sempre 'PENDING'
// a menos que o botão de simulação 'Dev' atualize esse estado de alguma forma.
// Para este MVP isolado, o botão "Simular Pago" no frontend forçará a liberação.

// Se você já tiver a tabela no Supabase conectada, pode colar o código de consulta aqui.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const externalId = searchParams.get("externalId");

    if (!externalId && !id) {
      return NextResponse.json({ error: "ID externo ou ID da transação ausente" }, { status: 400 });
    }

    if (id) {
      const ggResponse = await fetch(`https://ggpixapi.com/api/v1/transactions/${id}`, {
        method: "GET",
        headers: {
          "X-API-Key": process.env.GGPIX_API_KEY || "",
        },
      });
      
      if (ggResponse.ok) {
        const ggData = await ggResponse.json();
        // If it's already complete, return it
        if (ggData.status === "COMPLETE") {
          return NextResponse.json({ status: "COMPLETE" });
        }
      } else {
        console.error("Erro ao consultar status na GG Pix:", await ggResponse.text().catch(() => ""));
      }
    }

    return NextResponse.json({ status: "PENDING" });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Status Check Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
