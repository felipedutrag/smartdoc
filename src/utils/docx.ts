import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Packer,
  BorderStyle,
  convertInchesToTwip,
} from "docx";

/**
 * Converte HTML gerado pelo Tiptap/SmartDoc diretamente em AST nativa do docx
 */
export function parseHtmlToDocxElements(rawHtml: string, title?: string): Paragraph[] {
  if (!rawHtml) return [];

  let html = rawHtml.trim();

  // Limpa highlights ou tags desnecessárias
  html = html.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, "$1");

  // Garante que o Nome da Ação nunca suma se o texto tiver "propor a presente" seguido de "em face de"
  if (/propor\s+a\s+presente\s*<\/p>\s*<p[^>]*>\s*em\s+face\s+de/i.test(html)) {
    const defaultAction = title && !title.toLowerCase().includes("peticao") ? title.toUpperCase() : "AÇÃO JUDICIAL";
    html = html.replace(
      /(propor\s+a\s+presente\s*<\/p>)/i,
      `$1<h2 style="text-align: center;">${defaultAction}</h2>`
    );
  }

  const blockRegex = /<(p|h1|h2|h3|blockquote|hr)([^>]*)>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi;
  const paragraphs: Paragraph[] = [];
  let match: RegExpExecArray | null;

  // Helper para converter HTML inline em TextRuns estilizados
  function parseInlineToRuns(
    innerHtml: string,
    defaultSize = 28, // 14pt (28 half-points)
    isDefaultBold = false,
    isDefaultItalic = false
  ): TextRun[] {
    const text = innerHtml.replace(/&nbsp;/g, " ").replace(/<br\s*\/?>/gi, "\n");
    const runs: TextRun[] = [];
    const parts = text.split(/(<strong[^>]*>[\s\S]*?<\/strong>|<b[^>]*>[\s\S]*?<\/b>|<em[^>]*>[\s\S]*?<\/em>|<i[^>]*>[\s\S]*?<\/i>)/gi);

    for (const part of parts) {
      if (!part) continue;
      if (/^<(strong|b)[^>]*>([\s\S]*?)<\/\1>$/i.test(part)) {
        const content = part.replace(/^<(strong|b)[^>]*>([\s\S]*?)<\/\1>$/i, "$2").replace(/<[^>]+>/g, "");
        runs.push(
          new TextRun({
            text: content,
            font: "Cambria",
            size: defaultSize,
            bold: true,
            italics: isDefaultItalic,
          })
        );
      } else if (/^<(em|i)[^>]*>([\s\S]*?)<\/\1>$/i.test(part)) {
        const content = part.replace(/^<(em|i)[^>]*>([\s\S]*?)<\/\1>$/i, "$2").replace(/<[^>]+>/g, "");
        runs.push(
          new TextRun({
            text: content,
            font: "Cambria",
            size: defaultSize,
            bold: isDefaultBold,
            italics: true,
          })
        );
      } else {
        const cleanText = part.replace(/<[^>]+>/g, "");
        if (cleanText) {
          runs.push(
            new TextRun({
              text: cleanText,
              font: "Cambria",
              size: defaultSize,
              bold: isDefaultBold,
              italics: isDefaultItalic,
            })
          );
        }
      }
    }

    if (runs.length === 0) {
      runs.push(new TextRun({ text: " ", font: "Cambria", size: defaultSize }));
    }

    return runs;
  }

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = (match[1] || "hr").toLowerCase();
    const attrs = match[2] || "";
    const inner = match[3] || "";

    const isCenter = attrs.includes("center") || attrs.includes("text-align: center") || attrs.includes("text-align:center");
    const isRight = attrs.includes("right") || attrs.includes("text-align: right") || attrs.includes("text-align:right");
    const alignment = isCenter ? AlignmentType.CENTER : isRight ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED;

    if (tag === "p") {
      const isEnderecamento = /EXCELENT[IÍ]SSIMO/i.test(inner);

      if (isEnderecamento) {
        // Endereçamento: 14pt, negrito, justificado
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 360, after: 240 },
            children: parseInlineToRuns(inner, 28, true),
          })
        );
        // 4 LINHAS DE RESPIRO OBRIGATÓRIAS ABAIXO DO ENDEREÇAMENTO
        for (let i = 0; i < 2; i++) {
          paragraphs.push(
            new Paragraph({
              spacing: { line: 360, after: 240 },
              children: [new TextRun({ text: "", font: "Cambria", size: 28 })],
            })
          );
        }
      } else {
        // Parágrafo padrão: 14pt (size: 28), Justificado, Cambria, 1 linha de espaçamento
        paragraphs.push(
          new Paragraph({
            alignment,
            spacing: { line: 360, after: 240 }, // 1 linha de espaçamento (12pt / 240 twips)
            children: parseInlineToRuns(inner, 28),
          })
        );
      }
    } else if (tag === "h2" || tag === "h1") {
      if (isCenter) {
        // NOME DA AÇÃO: 16pt (size: 32), Negrito, Centralizado, 1 linha acima e 1 linha abaixo
        paragraphs.push(
          new Paragraph({
            spacing: { line: 360, before: 240, after: 240 },
            alignment: AlignmentType.CENTER,
            children: parseInlineToRuns(inner.toUpperCase(), 32, true),
          })
        );
      } else {
        // TÍTULOS DE SEÇÃO (I. DOS FATOS, II. DO DIREITO, etc.): 16pt (size: 32), Negrito, Esquerda, 2 linhas acima e 1 linha abaixo
        paragraphs.push(
          new Paragraph({
            spacing: { line: 360, before: 480, after: 240 },
            alignment: AlignmentType.LEFT,
            children: parseInlineToRuns(inner, 32, true),
          })
        );
      }
    } else if (tag === "h3") {
      // Subtítulo: 14pt (size: 28), Negrito, Esquerda, 1 linha acima
      paragraphs.push(
        new Paragraph({
          spacing: { line: 360, before: 240, after: 240 },
          alignment: AlignmentType.LEFT,
          children: parseInlineToRuns(inner, 28, true),
        })
      );
    } else if (tag === "blockquote") {
      // Citações / Artigos de Lei: 12pt (size: 24), Itálico, Recuo 4cm (1.5 in), Justificado
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: convertInchesToTwip(1.5) },
          spacing: { line: 280, before: 240, after: 240 },
          border: {
            left: {
              color: "0F172A",
              space: 12,
              style: BorderStyle.SINGLE,
              size: 16,
            },
          },
          children: parseInlineToRuns(inner, 24, false, true),
        })
      );
    } else if (tag === "hr") {
      paragraphs.push(
        new Paragraph({
          spacing: { before: 240, after: 240 },
          border: {
            bottom: {
              color: "CBD5E1",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          children: [],
        })
      );
    }
  }

  // Fallback caso a regex de blocos não capture nada (e.g. texto plano)
  if (paragraphs.length === 0 && html.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 240 },
        children: parseInlineToRuns(html, 28),
      })
    );
  }

  return paragraphs;
}

export async function getWordBuffer(title: string, rawHtml: string): Promise<Buffer> {
  const paragraphs = parseHtmlToDocxElements(rawHtml, title);

  const doc = new Document({
    title: title || "Petição Inicial",
    styles: {
      default: {
        document: {
          run: {
            font: "Cambria",
            size: 28, // 14pt
          },
          paragraph: {
            spacing: {
              line: 360, // 1.5 line spacing
              after: 240, // 12pt paragraph space
            },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1.18), // 3.0 cm margem superior
              left: convertInchesToTwip(1.18), // 3.0 cm margem esquerda
              bottom: convertInchesToTwip(0.79), // 2.0 cm margem inferior
              right: convertInchesToTwip(0.79), // 2.0 cm margem direita
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

export async function generateDocxBase64(title: string, rawHtml: string): Promise<string> {
  const buffer = await getWordBuffer(title, rawHtml);
  return buffer.toString("base64");
}
