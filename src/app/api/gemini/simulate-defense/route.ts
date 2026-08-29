import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export interface DefenseSimulationResult {
  resumoRisco: string;
  pontuacaoBlindagem: number; // 0 a 100
  preliminaresProvaveis: Array<{
    titulo: string;
    artigoCPC: string;
    probabilidade: "alta" | "media" | "baixa";
    explicacao: string;
    estrategiaBlindagem: string;
  }>;
  tesesMeritoRe: Array<{
    tese: string;
    argumentoProvavel: string;
    contrapontoSugerido: string;
  }>;
  vulnerabilidadesProbatorias: string[];
  paragrafosBlindagemSugeridos: Array<{
    tituloTopico: string;
    ondeInserir: "antes_dos_pedidos" | "no_direito" | "nos_fatos";
    paragrafos: string[];
  }>;
}

export async function POST(req: Request) {
  try {
    const { html, text } = await req.json();
    const content = text || (html ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") : "");

    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: "Conteúdo da petição insuficiente para simulação." },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const systemInstruction = `
Você é o Auditor de Defesa e Estrategista Adversarial Forense do SmartDoc — um Advogado de Defesa Sênior, Implacável e Estrategista Processual.
Sua missão é dissecar a Petição Inicial submetida e projetar EXATAMENTE como a Banca de Defesa da parte Ré irá contestar esta demanda.

OBJETIVOS DA AUDITORIA ADVERSARIAL:
1. Identificar as PRELIMINARES PROCESSUAIS (CPC/15, art. 337) mais prováveis que a Ré vai arguir (ex: inépcia da petição inicial, ilegitimidade de parte, falta de interesse de agir, incompetência absoluta/relativa, impugnação ao valor da causa, impugnação à gratuidade da justiça).
2. Identificar as TESES DE MÉRITO (ex: culpa exclusiva da vítima/terceiro, ausência de ato ilícito, mero aborrecimento, desproporcionalidade do valor pleiteado).
3. Apontar VULNERABILIDADES PROBATÓRIAS (documentos faltantes, alegações sem respaldo documental, ausência de planilha de cálculo).
4. Redigir PARÁGRAFOS PREVENTIVOS DE BLINDAGEM prontos para o autor incluir na inicial antes de protocolar, neutralizando os futuros argumentos da Ré.

FORMATO DE RESPOSTA (ESTRITAMENTE JSON VÁLIDO):
{
  "resumoRisco": "Diagnóstico conciso de 2 frases sobre os principais pontos de vulnerabilidade da petição...",
  "pontuacaoBlindagem": 85,
  "preliminaresProvaveis": [
    {
      "titulo": "Impugnação à Concessão da Gratuidade da Justiça",
      "artigoCPC": "Art. 337, XIII, do CPC",
      "probabilidade": "alta",
      "explicacao": "A Ré alegará ausência de prova documental cabal da hipossuficiência financeira do Autor.",
      "estrategiaBlindagem": "Acostar extratos bancários, carteira de trabalho ou declaração de IRPF desde a exordial."
    }
  ],
  "tesesMeritoRe": [
    {
      "tese": "Mero Dissabor / Ausência de Dano Moral In Re Ipsa",
      "argumentoProvavel": "A Ré sustentará que a falha na prestação do serviço não ultrapassou o mero dissabor cotidiano.",
      "contrapontoSugerido": "Reforçar a teoria do Desvio Produtivo do Consumidor e juntar protocolos de atendimento não resolvidos."
    }
  ],
  "vulnerabilidadesProbatorias": [
    "Falta de comprovação da data exata da primeira reclamação administrativa.",
    "Ausência de especificação analítica da memória de cálculo dos danos materiais."
  ],
  "paragrafosBlindagemSugeridos": [
    {
      "tituloTopico": "Da Evidente Caracterização do Dano Moral e do Desvio Produtivo",
      "ondeInserir": "no_direito",
      "paragrafos": [
        "Impende registrar que a conduta reiterada e recalcitrante da Requerida transborda a esfera do mero aborrecimento, impondo ao Requerente um injustificável desvio de seu tempo produtivo para tentar sanar administrativamente um vício a que não deu causa.",
        "Nessa toada, a jurisprudência pacífica do Superior Tribunal de Justiça consagra a indenizabilidade autônoma pelo tempo desperdiçado em razão da inércia do fornecedor."
      ]
    }
  ]
}
`;

    const prompt = `PETIÇÃO INICIAL PARA SIMULAÇÃO ADVERSARIAL:\n\n"""\n${content.slice(0, 18000)}\n"""\n\nProjete a contestação e gere a simulação completa:`;

    const FALLBACK_MODELS = [
      "gemini-2.5-flash",
      "gemini-3.5-flash",
      "gemini-2.5-flash-lite",
    ];

    const genAI = new GoogleGenerativeAI(geminiKey);
    let resultJson: DefenseSimulationResult | null = null;
    let lastError: any = null;

    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        });

        const res = await model.generateContent(prompt);
        const raw = res.response?.text() || "{}";
        let clean = raw.trim();
        if (clean.startsWith("```json")) {
          clean = clean.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (clean.startsWith("```")) {
          clean = clean.replace(/^```/, "").replace(/```$/, "").trim();
        }

        resultJson = JSON.parse(clean);
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[SIMULATE DEFENSE] Falha no modelo ${modelName}:`, err?.message || err);
      }
    }

    if (!resultJson) {
      throw lastError || new Error("Não foi possível gerar a simulação adversarial.");
    }

    return NextResponse.json(resultJson);
  } catch (error: any) {
    console.error("[SIMULATE DEFENSE ERROR]:", error?.message || error);
    return NextResponse.json(
      { error: "Erro ao simular contestação adversarial.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
