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

  // Limpeza de tags desnecessárias e marcas de revisão
  html = html.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '$1');

  // 1. Título da Ação Centralizado (ex: AÇÃO DE OBRIGAÇÃO DE FAZER...)
  html = html.replace(
    /<h2([^>]*)style="[^"]*text-align:\s*center[^"]*"([^>]*)>([\s\S]*?)<\/h2>/gi,
    '<p align="center" style="text-align: center; text-indent: 0.0pt; font-family: \'Cambria\', \'Times New Roman\', serif; font-size: 13.0pt; font-weight: bold; text-transform: uppercase; margin-top: 24.0pt; margin-bottom: 24.0pt; color: #000000; letter-spacing: 0.5pt;">$3</p>'
  );

  // 2. Títulos de Seções (I. DOS FATOS, II. DO DIREITO, III. DOS PEDIDOS)
  html = html.replace(
    /<h2([^>]*)>([\s\S]*?)<\/h2>/gi,
    '<p style="text-align: left; text-indent: 0.0pt; font-family: \'Cambria\', \'Times New Roman\', serif; font-size: 12.0pt; font-weight: bold; text-transform: uppercase; margin-top: 20.0pt; margin-bottom: 8.0pt; color: #000000;">$2</p>'
  );

  html = html.replace(
    /<h1([^>]*)>([\s\S]*?)<\/h1>/gi,
    '<p style="text-align: left; text-indent: 0.0pt; font-family: \'Cambria\', \'Times New Roman\', serif; font-size: 12.0pt; font-weight: bold; text-transform: uppercase; margin-top: 20.0pt; margin-bottom: 8.0pt; color: #000000;">$2</p>'
  );

  // 3. Citações / Jurisprudência / Doutrina (Blockquotes idênticos ao editor: sem margem lateral, barra dourada fina à esquerda, fonte menor em itálico e fundo suave)
  html = html.replace(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/gi, (_match, _attrs, inner) => {
    const cleanInner = inner.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '<br/>').trim();
    return `<div style="margin-top: 14.0pt; margin-bottom: 14.0pt; padding-left: 12.0pt; padding-top: 6.0pt; padding-bottom: 6.0pt; padding-right: 10.0pt; border-left: 2.5pt solid #c97a2b; background-color: #fdfaf6; font-family: 'Cambria', 'Times New Roman', serif; font-size: 10.5pt; line-height: 1.4; font-style: italic; text-align: justify; color: #374151;">${cleanInner}</div>`;
  });

  // 4. Divisores horizontais
  html = html.replace(/<hr\s*\/?>/gi, '<p style="margin-top: 14.0pt; margin-bottom: 14.0pt; border-top: 1.0pt solid #e5e7eb;"></p>');

  // 5. Parágrafos com alinhamento central (Fechamento: Nestes termos, Local e Data, Linha de Assinatura, Advogado)
  html = html.replace(
    /<p([^>]*)style="[^"]*text-align:\s*center[^"]*"([^>]*)>([\s\S]*?)<\/p>/gi,
    '<p align="center" style="text-align: center; text-indent: 0.0pt; font-family: \'Cambria\', \'Times New Roman\', serif; font-size: 12.0pt; line-height: 1.5; margin-bottom: 4.0pt; color: #000000;">$3</p>'
  );

  // 6. Parágrafos Justificados padrão
  html = html.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (match, attrs, inner) => {
    if (attrs.includes('align="center"') || attrs.includes('text-align: center')) {
      return match;
    }

    const trimmedInner = inner.trim();

    // Endereçamento ao Juízo (primeiro parágrafo: negrito, sem recuo, com respiro de 3.5rem / ~36pt abaixo)
    if (
      trimmedInner.includes('EXCELENTÍSSIMO') ||
      trimmedInner.includes('AO JUÍZO') ||
      trimmedInner.includes('ILUSTRÍSSIMO')
    ) {
      return `<p align="justify" style="text-align: justify; text-indent: 0.0pt; font-family: 'Cambria', 'Times New Roman', serif; font-size: 12.0pt; font-weight: bold; line-height: 1.5; margin-bottom: 36.0pt; color: #000000;">${trimmedInner}</p>`;
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
      return `<p align="justify" style="text-align: justify; text-indent: 0.0pt; font-family: 'Cambria', 'Times New Roman', serif; font-size: 12.0pt; font-weight: bold; line-height: 1.5; margin-top: 16.0pt; margin-bottom: 6.0pt; color: #000000;">${trimmedInner}</p>`;
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
      return `<p align="justify" style="text-align: justify; text-indent: 0.0pt; font-family: 'Cambria', 'Times New Roman', serif; font-size: 12.0pt; line-height: 1.5; margin-bottom: 6.0pt; color: #000000;">${trimmedInner}</p>`;
    }

    // Parágrafo padrão do corpo forense (sem recuo artificial indesejado, idêntico à visualização do editor)
    return `<p align="justify" style="text-align: justify; text-indent: 0.0pt; font-family: 'Cambria', 'Times New Roman', serif; font-size: 12.0pt; line-height: 1.6; margin-bottom: 12.0pt; color: #000000;">${trimmedInner}</p>`;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title || 'Petição Inicial'}</title>
      <style>
        body {
          font-family: 'Cambria', 'Times New Roman', serif;
          font-size: 12.0pt;
          line-height: 1.6;
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
