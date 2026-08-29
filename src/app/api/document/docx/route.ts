import { NextResponse } from "next/server";
import { getWordBuffer } from "@/utils/docx";

function extractAndSanitizeFilename(title: string, content: string): string {
  let rawName = title || "";
  
  // Se title for vazio ou genérico, tenta achar o <h2> do nome da ação no HTML
  if (!rawName || rawName.toLowerCase().includes("peticao_inicial") || rawName.toLowerCase().includes("smartdoc")) {
    const h2Match = content.match(/<h2[^>]*>((?:(?!<\/h2>)[\s\S])*?)<\/h2>/i);
    if (h2Match && h2Match[1]) {
      const cleanH2 = h2Match[1].replace(/<[^>]+>/g, "").trim();
      if (cleanH2 && !cleanH2.startsWith("I.") && !cleanH2.startsWith("II.") && !cleanH2.startsWith("III.")) {
        rawName = cleanH2;
      }
    }
  }

  if (!rawName) rawName = "peticao-inicial";

  const sanitized = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return `${sanitized || "peticao-inicial"}.docx`;
}

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

    const filename = extractAndSanitizeFilename(title, content);
    const fileBuffer = await getWordBuffer(title || filename.replace(".docx", ""), content);

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
