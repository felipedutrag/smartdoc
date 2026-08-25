import HTMLtoDOCX from 'html-to-docx';

/**
 * Converte e estiliza o HTML gerado pelo editor para os padrões forenses oficiais (ABNT / CNJ / Tribunais Brasileiros) no Word (.docx):
 * - Fonte: Times New Roman, 12pt
 * - Espaçamento entre linhas: 1,5
 * - Margens: Superior 3cm, Esquerda 3cm, Inferior 2cm, Direita 2cm
 * - Recuo de parágrafo de primeira linha: 1,25cm (36pt)
 * - Citações doutrinárias/jurisprudenciais: Recuo à esquerda de 4cm (113pt), fonte 10pt, espaçamento simples
 * - Títulos destacados em negrito com espaçamento adequado
 * - Assinatura e preâmbulo perfeitamente diagramados
 */
export function compileWordHtml(title: string, rawHtml: string): string {
  if (!rawHtml) return '';

  let html = rawHtml.trim();

  // Limpeza de tags vazias e spans residuais
  html = html.replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '');

  // 1. Título da Ação Centralizado (ex: AÇÃO DE COBRANÇA C/C INDENIZAÇÃO)
  html = html.replace(
    /<h2([^>]*)style="[^"]*text-align:\s*center[^"]*"([^>]*)>([\s\S]*?)<\/h2>/gi,
    '<p align="center" style="text-align: center; text-indent: 0.0pt; font-family: \'Times New Roman\', serif; font-size: 13.0pt; font-weight: bold; text-transform: uppercase; margin-top: 18.0pt; margin-bottom: 18.0pt; color: #000000;">$3</p>'
  );

  // 2. Títulos de Seções (I. DOS FATOS, II. DO DIREITO, III. DOS PEDIDOS)
  html = html.replace(
    /<h2([^>]*)>([\s\S]*?)<\/h2>/gi,
    '<p style="text-align: left; text-indent: 0.0pt; font-family: \'Times New Roman\', serif; font-size: 12.0pt; font-weight: bold; text-transform: uppercase; margin-top: 18.0pt; margin-bottom: 8.0pt; color: #000000;">$2</p>'
  );

  html = html.replace(
    /<h1([^>]*)>([\s\S]*?)<\/h1>/gi,
    '<p style="text-align: left; text-indent: 0.0pt; font-family: \'Times New Roman\', serif; font-size: 12.0pt; font-weight: bold; text-transform: uppercase; margin-top: 18.0pt; margin-bottom: 8.0pt; color: #000000;">$2</p>'
  );

  // 3. Citações / Jurisprudência / Doutrina (Blockquotes com recuo forense de 4.0cm = 113pt)
  html = html.replace(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/gi, (_match, _attrs, inner) => {
    const cleanInner = inner.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '<br/>');
    return `<div style="margin-left: 113.0pt; margin-right: 0.0pt; margin-top: 10.0pt; margin-bottom: 10.0pt; padding-left: 12.0pt; border-left: 2.5pt solid #4b5563; font-family: 'Times New Roman', serif; font-size: 10.0pt; line-height: 1.15; font-style: italic; text-align: justify; color: #1f2937;">${cleanInner}</div>`;
  });

  // 4. Divisores horizontais
  html = html.replace(/<hr\s*\/?>/gi, '<p style="margin-top: 12.0pt; margin-bottom: 12.0pt; border-top: 1.0pt solid #d1d5db;"></p>');

  // 5. Parágrafos com alinhamento central (Fechamento: Nestes termos, Local e Data, Linha de Assinatura, Advogado)
  html = html.replace(
    /<p([^>]*)style="[^"]*text-align:\s*center[^"]*"([^>]*)>([\s\S]*?)<\/p>/gi,
    '<p align="center" style="text-align: center; text-indent: 0.0pt; font-family: \'Times New Roman\', serif; font-size: 12.0pt; line-height: 1.5; margin-bottom: 6.0pt; color: #000000;">$3</p>'
  );

  // 6. Parágrafos Justificados padrão
  html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, inner) => {
    // Não mexer nos parágrafos centralizados já processados
    if (attrs.includes('align="center"') || attrs.includes('text-align: center')) {
      return match;
    }

    const trimmedInner = inner.trim();

    // Endereçamento ao Juízo (primeiro parágrafo em caixa alta)
    if (
      trimmedInner.includes('EXCELENTÍSSIMO') ||
      trimmedInner.includes('AO JUÍZO') ||
      trimmedInner.includes('ILUSTRÍSSIMO')
    ) {
      return `<p align="justify" style="text-align: justify; text-indent: 0.0pt; font-family: 'Times New Roman', serif; font-size: 12.0pt; font-weight: bold; line-height: 1.5; margin-bottom: 18.0pt; color: #000000;">${trimmedInner}</p>`;
    }

    // Subtítulos do Direito (ex: 1. Da Relação de Consumo)
    if (
      trimmedInner.startsWith('<strong>1.') ||
      trimmedInner.startsWith('<strong>2.') ||
      trimmedInner.startsWith('<strong>3.') ||
      trimmedInner.startsWith('<strong>4.') ||
      trimmedInner.startsWith('<strong>5.') ||
      attrs.includes('font-weight: bold')
    ) {
      return `<p align="justify" style="text-align: justify; text-indent: 0.0pt; font-family: 'Times New Roman', serif; font-size: 12.0pt; font-weight: bold; line-height: 1.5; margin-top: 14.0pt; margin-bottom: 6.0pt; color: #000000;">${trimmedInner}</p>`;
    }

    // Alíneas de pedidos (ex: a) A concessão da justiça gratuita)
    if (
      trimmedInner.includes('<strong>a)') ||
      trimmedInner.includes('<strong>b)') ||
      trimmedInner.includes('<strong>c)') ||
      trimmedInner.includes('<strong>d)') ||
      trimmedInner.includes('<strong>e)') ||
      trimmedInner.includes('<strong>f)') ||
      trimmedInner.includes('<strong>g)')
    ) {
      return `<p align="justify" style="text-align: justify; text-indent: 20.0pt; font-family: 'Times New Roman', serif; font-size: 12.0pt; line-height: 1.5; margin-bottom: 6.0pt; color: #000000;">${trimmedInner}</p>`;
    }

    // Parágrafo padrão do corpo forense com recuo de 1,25cm (36pt)
    return `<p align="justify" style="text-align: justify; text-indent: 36.0pt; font-family: 'Times New Roman', serif; font-size: 12.0pt; line-height: 1.5; margin-bottom: 8.0pt; color: #000000;">${trimmedInner}</p>`;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title || 'Petição Inicial'}</title>
      <style>
        body {
          font-family: 'Times New Roman', serif;
          font-size: 12.0pt;
          line-height: 1.5;
          color: #000000;
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
}

export async function getWordBuffer(title: string, rawHtml: string): Promise<Buffer> {
  const cleanHtml = compileWordHtml(title, rawHtml);

  const fileBuffer = await HTMLtoDOCX(cleanHtml, null, {
    title: title || 'Petição Inicial SmartDoc',
    font: 'Times New Roman',
    fontSize: 24, // 24 half-points = 12pt
    margins: {
      top: 1701,    // 3.0 cm (Padrão Forense ABNT / Tribunais)
      left: 1701,   // 3.0 cm
      bottom: 1134, // 2.0 cm
      right: 1134,  // 2.0 cm
    },
  });

  return fileBuffer as unknown as Buffer;
}

export async function generateDocxBase64(title: string, rawHtml: string): Promise<string> {
  const buffer = await getWordBuffer(title, rawHtml);
  return buffer.toString('base64');
}
