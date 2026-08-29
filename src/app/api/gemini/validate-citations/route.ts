import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export interface CitationAuditItem {
  codigo: string;
  tipo: "artigo" | "sumula" | "tema" | "jurisprudencia" | "doutrina" | "lei";
  status: "valid" | "warning" | "hallucination";
  veredito: string;
  explicacao: string;
  sugestao?: string;
  linkOficial?: string;
}

export async function POST(req: Request) {
  try {
    const { text, html, items } = await req.json();

    const contentToAudit = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") : "");

    if (!contentToAudit || contentToAudit.trim().length < 10) {
      return NextResponse.json({ results: [] });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const systemInstruction = `
Você é o Auditor Jurídico Forense Sênior e Validador Anti-Alucinação do SmartDoc.
Sua missão é realizar uma auditoria implacável (double check) em todas as citações normativas, jurisprudenciais e doutrinárias presentes na petição judicial.

OBJETIVO DA AUDITORIA:
1. Identificar TODOS os artigos de lei, códigos, súmulas, temas repetitivos/repercussão geral, números de acórdãos/REsp/RE e citações doutrinárias.
2. Checar a EXISTÊNCIA REAL e VIGÊNCIA de cada dispositivo:
   - O artigo existe no diploma citado? Está em vigor ou foi revogado?
   - A súmula (STJ/STF) existe com esse exato número e diz o que a peça afirma?
   - O precedente jurisprudencial (REsp, RE, Tema) é verídico ou foi alucinado/inventado pela IA?
   - A menção doutrinária é condizente com a posição do jurista citado?

3. CLASSIFICAÇÃO RIGOROSA DO STATUS:
   - "valid": Dispositivo existe, está vigente e foi aplicado com fidelidade.
   - "warning": Dispositivo existe, mas tem ressalvas (ex: redação alterada recentemente, aplicabilidade controvertida, ou não é pacífico).
   - "hallucination": Dispositivo NÃO existe, número inventado, súmula com enunciado trocado, artigo inexistente ou precedente falso.

REGRAS DE RETORNO:
- Retorne EXCLUSIVAMENTE um array JSON de objetos com o seguinte formato exato:
[
  {
    "codigo": "Art. 186 do Código Civil",
    "tipo": "artigo",
    "status": "valid",
    "veredito": "Dispositivo vigente e plenamente aplicável",
    "explicacao": "O art. 186 do CC consagra a cláusula geral de responsabilidade civil subjetiva por ato ilícito.",
    "sugestao": null,
    "linkOficial": "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm"
  },
  {
    "codigo": "Súmula 999 do STJ",
    "tipo": "sumula",
    "status": "hallucination",
    "veredito": "Súmula Inexistente no STJ",
    "explicacao": "O STJ não possui súmula com esse número. Trata-se de alucinação de numeração.",
    "sugestao": "Utilizar a Súmula 385 do STJ ou precedente em REsp específico.",
    "linkOficial": "https://www.stj.jus.br"
  }
]

Tipos permitidos: "artigo" | "sumula" | "tema" | "jurisprudencia" | "doutrina" | "lei".
Sem blocos markdown adicionais (\`\`\`json), apenas o JSON array puro.
`;

    const prompt = `TEXTO DA PETIÇÃO JUDICIAL PARA AUDITORIA:\n\n"""\n${contentToAudit.slice(0, 15000)}\n"""\n\n${
      items && items.length > 0
        ? `DISPOSITIVOS JÁ MAPEADOS PRELIMINARMENTE (valide estes e outros encontrados):\n${JSON.stringify(items, null, 2)}\n\n`
        : ""
    }Analise e gere o relatório JSON de validação:`;

    const FALLBACK_MODELS = [
      "gemini-2.5-flash",
      "gemini-3.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
    ];

    const genAI = new GoogleGenerativeAI(geminiKey);
    let auditResults: CitationAuditItem[] = [];
    let lastError: any = null;

    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        });

        const result = await model.generateContent(prompt);
        const rawText = result.response?.text() || "[]";

        let cleanJson = rawText.trim();
        if (cleanJson.startsWith("```json")) {
          cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (cleanJson.startsWith("```")) {
          cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
        }

        const parsed = JSON.parse(cleanJson);
        auditResults = Array.isArray(parsed) ? parsed : [];
        lastError = null;
        break; // Sucesso
      } catch (err: any) {
        lastError = err;
        console.warn(`[VALIDATE CITATIONS] Falha no modelo ${modelName}:`, err?.message || err);
      }
    }

    if (lastError && auditResults.length === 0) {
      throw lastError;
    }

    return NextResponse.json({
      results: auditResults,
      auditedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[VALIDATE CITATIONS ERROR]:", error?.message || error);
    return NextResponse.json(
      { error: "Erro ao auditar dispositivos e citações.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
