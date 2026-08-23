import HTMLtoDOCX from 'html-to-docx';

export function compileWordHtml(title: string, rawHtml: string): string {
  // Clear leading blank lines
  let styledHtml = rawHtml.replace(/^(<p><\/p>|<p><br><\/p>|\s|<br>)+/gi, '').trim();

  // Force inline styles for Headings because html-to-docx sometimes ignores CSS classes for alignment
  styledHtml = styledHtml.replace(/<h1/gi, '<h1 align="justify" style="text-align: justify; font-size: 12.0pt; font-weight: bold; text-transform: uppercase; margin-top: 0pt; margin-bottom: 18pt; color: #000000;"');
  styledHtml = styledHtml.replace(/<h2/gi, '<h2 style="font-size: 12.0pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; color: #111827;"');

  // Customize blockquote style (Visual Law box)
  styledHtml = styledHtml.replace(/<blockquote([^>]*)>/gi, (match, attrs) => {
    if (attrs.includes('style="')) {
      return `<blockquote${attrs.replace('style="', 'style="background-color: #faf6f0; border-left: 3px solid #d97706; padding: 10px 15px; margin: 15px 0; color: #1a1a1a; font-style: italic; ')}>`;
    }
    return `<blockquote style="background-color: #faf6f0; border-left: 3px solid #d97706; padding: 10px 15px; margin: 15px 0; color: #1a1a1a; font-style: italic;">`;
  });

  // Force justified alignment on all paragraphs and lists except center/right aligned ones
  styledHtml = styledHtml.replace(/<(p|li)([^>]*)>/gi, (match, tag, attrs) => {
    if (attrs.includes('text-align: center') || attrs.includes('text-align: right') || attrs.includes('align="center"') || attrs.includes('align="right"')) {
      return match;
    }
    if (attrs.includes('style="')) {
      return `<${tag}${attrs.replace('style="', 'align="justify" style="text-align: justify; line-height: 1.5; font-size: 11.5pt; color: #1a1a1a; ')}>`;
    }
    return `<${tag}${attrs} align="justify" style="text-align: justify; line-height: 1.5; font-size: 11.5pt; color: #1a1a1a;">`;
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title || 'Documento SmartDoc'}</title>
      <style>
        body {
          font-family: 'Cambria', 'Times New Roman', serif;
          font-size: 11.5pt;
          line-height: 1.5;
          color: #1a1a1a;
        }
        h1 {
          font-family: 'Cambria', 'Times New Roman', serif;
          font-size: 12.0pt;
          font-weight: bold;
          text-align: justify;
          text-transform: uppercase;
          margin-top: 12.0pt;
          margin-bottom: 18.0pt;
          color: #000000;
        }
        h2 {
          font-family: 'Cambria', 'Times New Roman', serif;
          font-size: 13.0pt;
          font-weight: bold;
          margin-top: 18.0pt;
          margin-bottom: 6.0pt;
          color: #111827;
        }
        p {
          font-family: 'Cambria', 'Times New Roman', serif;
          text-align: justify;
          margin-bottom: 8.0pt;
          line-height: 1.5;
          font-size: 11.5pt;
          color: #1a1a1a;
        }
        p:not([data-node-text-align="center"]):not([data-node-text-align="right"]):not(.align-center):not(.align-right):not(.no-indent) {
          text-indent: 36.0pt;
        }
        blockquote {
          background-color: #faf6f0;
          border-left: 3.0pt solid #d97706;
          padding: 8.0pt 12.0pt;
          margin: 12.0pt 0.0pt;
          font-style: italic;
          font-family: 'Cambria', 'Times New Roman', serif;
        }
        blockquote p {
          text-indent: 0.0pt !important;
          margin-bottom: 4.0pt;
        }
        hr {
          border: none;
          border-top: 1.0pt solid #e5e7eb;
          margin: 18.0pt 0.0pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12.0pt;
          margin-bottom: 12.0pt;
        }
        td, th {
          border: 1.0pt solid #d1d5db;
          padding: 8.0pt 10.0pt;
          text-align: left;
          vertical-align: top;
        }
      </style>
    </head>
    <body>
      ${styledHtml}
    </body>
    </html>
  `;
}

export async function getWordBuffer(title: string, rawHtml: string): Promise<Buffer> {
  const cleanHtml = compileWordHtml(title, rawHtml);
  
  const fileBuffer = await HTMLtoDOCX(cleanHtml, null, {
    title: title || 'Documento SmartDoc',
    font: 'Cambria',
    margins: {
      top: 1440,
      right: 1440,
      bottom: 1440,
      left: 1440
    }
  });
  
  return fileBuffer as unknown as Buffer;
}

export async function generateDocxBase64(title: string, rawHtml: string): Promise<string> {
  const buffer = await getWordBuffer(title, rawHtml);
  return buffer.toString('base64');
}
