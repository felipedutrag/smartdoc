import { NextResponse } from "next/server";
import { getWordBuffer } from "@/utils/docx";

export async function POST(request: Request) {
  try {
    let title = "";
    let content = "";
    
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json() as { title?: string; content?: string };
      title = body.title || "";
      content = body.content || "";
    } else {
      const formData = await request.formData();
      title = formData.get("title") as string;
      content = formData.get("content") as string;
    }

    if (!content) {
      return NextResponse.json({ error: "Conteúdo vazio" }, { status: 400 });
    }

    const fileBuffer = await getWordBuffer(title || "Peticao_Inicial", content);
    const filename = `${(title || 'peticao_inicial').replace(/[^a-zA-Z0-9\-_]/g, '_')}.docx`;

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[export-docx] Erro ao gerar DOCX:", message);
    return NextResponse.json({ error: "Falha ao gerar o documento." }, { status: 500 });
  }
}
