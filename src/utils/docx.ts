import HTMLtoDOCX from 'html-to-docx';

export function compileWordHtml(title: string, rawHtml: string): string {
  if (!rawHtml) return '';

  let html = rawHtml.trim();

  // Highlight marks
  html = html.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '<span style="background-color: #fef08a;">$1</span>');

  // Headings
  html = html.replace(/<h1([^>]*)>((?:(?!<\/h1>)[\s\S])*?)<\/h1>/gi, 
    '<h1 style="font-family: \'Cambria\', serif; font-size: 14.0pt; font-weight: bold; text-align: justify; text-transform: uppercase; margin-top: 18.0pt; margin-bottom: 18.0pt;">$2</h1>');

  html = html.replace(/<h2([^>]*)>((?:(?!<\/h2>)[\s\S])*?)<\/h2>/gi, 
    (match, attrs, inner) => {
      const align = (attrs.includes('center') || attrs.includes('text-align: center') || attrs.includes('text-align:center')) ? 'center' : 'left';
      return `<h2 style="font-family: 'Cambria', serif; font-size: 14.0pt; font-weight: bold; text-align: ${align}; margin-top: 18.0pt; margin-bottom: 12.0pt;">${inner}</h2>`;
    }
  );

  html = html.replace(/<h3([^>]*)>((?:(?!<\/h3>)[\s\S])*?)<\/h3>/gi, 
    '<h3 style="font-family: \'Cambria\', serif; font-size: 13.0pt; font-weight: bold; text-align: left; margin-top: 14.0pt; margin-bottom: 8.0pt;">$2</h3>');

  // Blockquote (Citações) - Tiptap style
  html = html.replace(/<blockquote([^>]*)>((?:(?!<\/blockquote>)[\s\S])*?)<\/blockquote>/gi, (_match, _attrs, inner) => {
    const cleanInner = inner.replace(/<p([^>]*)>/gi, '').replace(/<\/p>/gi, '<br/><br/>').trim();
    return `<div style="margin-top: 16.0pt; margin-bottom: 16.0pt; padding-left: 12.0pt; border-left: 2.0pt solid #0f172a; background-color: #f8fafc; font-family: 'Cambria', serif; font-size: 10.5pt; line-height: 1.45; font-style: italic; text-align: justify; color: #334155;">${cleanInner}</div>`;
  });

  // hr
  html = html.replace(/<hr\s*\/?>/gi, '<div style="margin-top: 16.0pt; margin-bottom: 16.0pt; border-bottom: 1.0pt solid #e2e8f0;"></div>');

  // p
  html = html.replace(/<p([^>]*)>((?:(?!<\/p>)[\s\S])*?)<\/p>/gi, (match, attrs, inner) => {
    const align = (attrs.includes('center') || attrs.includes('text-align: center') || attrs.includes('text-align:center')) ? 'center' : 
                  (attrs.includes('right') || attrs.includes('text-align: right') || attrs.includes('text-align:right')) ? 'right' : 'justify';
    
    return `<p style="text-align: ${align}; font-family: 'Cambria', serif; font-size: 12.0pt; line-height: 1.65; margin-top: 6.0pt; margin-bottom: 12.0pt;">${inner}</p>`;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title || 'Documento'}</title>
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
    title: title || 'Documento SmartDoc',
    font: 'Cambria',
    fontSize: 24,
    lineSpacing: 396,
    paragraphSpacing: {
      before: 120,
      after: 240,
    },
    margins: {
      top: 1701,
      left: 1701,
      bottom: 1134,
      right: 1134,
    },
  });

  return fileBuffer as unknown as Buffer;
}

export async function generateDocxBase64(title: string, rawHtml: string): Promise<string> {
  const buffer = await getWordBuffer(title, rawHtml);
  return buffer.toString('base64');
}
