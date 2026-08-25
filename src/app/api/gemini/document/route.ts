import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

import { getLegalKnowledgeBase } from "@/knowledge";

export async function POST(req: Request) {
  try {
    const keys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_AUDIO_API_KEY,
    ].filter(Boolean) as string[];

    const apiKey = keys.length > 0 ? keys[0] : "";
    const groqKey = process.env.GROQ_API_KEY;

    if (!apiKey && !groqKey) {
      throw new Error("Nenhuma API Key encontrada (Nem Gemini, nem Groq).");
    }

    const { facts, continueFrom, attempt = 0 } = await req.json();

    if (!facts) {
      return NextResponse.json({ error: "Fatos não fornecidos." }, { status: 400 });
    }

    const fallbackModels = [
      "openai/gpt-oss-120b",     // Tentativa 0 (Principal - Groq GPT-OSS 120B)
      "llama-3.3-70b-versatile", // Tentativa 1 (Fallback Groq Llama 3.3 70B)
      "gemini-2.5-flash",        // Tentativa 2 (Fallback Gemini Flash)
      "gemini-2.5-pro",          // Tentativa 3 (Fallback Gemini Pro)
      "gemini-3.0-flash",        // Tentativa 4
    ];
    
    const modelName = fallbackModels[attempt] || "openai/gpt-oss-120b";
    const knowledgeBase = getLegalKnowledgeBase();
    
    const systemInstruction = `
Você é um jurista e especialista em redação de peças processuais de alto nível técnico no Brasil.
Seu objetivo é analisar os fatos fornecidos e redigir uma Petição Inicial COMPLETA, EXTENSA, COM PROFUNDA FUNDAMENTAÇÃO JURÍDICA E CITANDO ARTIGOS DE LEI E JURISPRUDÊNCIA.
${knowledgeBase ? `
BASE DE CONHECIMENTO E PRECEDENTES VINCULANTES VIGENTES:
${knowledgeBase}

DIRETRIZES DE USO DA BASE DE CONHECIMENTO (STF / STJ):
1. SUBSUNÇÃO ANALÍTICA E RATIO DECIDENDI (NÃO TRANSCREVER MECANICAMENTE):
   - NUNCA se limite a apenas transcrever o texto da súmula, tese ou ementa isoladamente.
   - Aplique o precedente ao caso concreto: explique o raciocínio jurídico (*ratio decidendi*) do julgado, correlacionando expressamente os fatos da petição com o entendimento firmado pelo tribunal.
   - Indique o precedente de apoio (ex: "conforme pacificado pelo STF no julgamento do Tema X da Repercussão Geral / ADI Y / Súmula Vinculante Z") e demonstre por que a tese jurídica protege o direito da parte autora no caso narrado.
2. PRECISÃO TÉCNICA E GROUNDING RIGOROSO:
   - Use exclusivamente os precedentes e teses existentes na base de conhecimento ou teses firmadas de conhecimento público inequívoco.
` : ""}

SUA SAÍDA DEVE SER ESTRITAMENTE UM OBJETO JSON VÁLIDO (sem blocos markdown \`\`\`json, apenas o JSON cru).

O JSON DEVE SEGUIR RIGOROSAMENTE ESTA ESTRUTURA:
{
  "cabecalho": {
    "enderecamento": "EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE [CIDADE/ESTADO]"
  },
  "partes": {
    "autor": {
      "nome": "[NOME DO AUTOR]",
      "qualificacao": "[nacionalidade], [estado civil], [profissão], portador(a) do RG nº [Número] e inscrito(a) no CPF sob o nº [Número], residente e domiciliado(a) em [Endereço Completo]"
    },
    "tipoAcao": "AÇÃO [NOME DA AÇÃO ESPECÍFICA CONFORME OS FATOS]",
    "reu": {
      "nome": "[NOME DO RÉU]",
      "qualificacao": "[nacionalidade/tipo empresarial], inscrito(a) no CPF/CNPJ sob o nº [Número], com sede/domicílio em [Endereço Completo]"
    }
  },
  "fatos": [
    "Parágrafo 1 detalhando o início da relação e histórico fático...",
    "Parágrafo 2 detalhando a conduta ilícita, vício, inadimplemento ou ato gerador...",
    "Parágrafo 3 aprofundando as consequências e prejuízos sofridos..."
  ],
  "direito": [
    {
      "subtitulo": "1. Da Relação Jurídica e Aplicabilidade das Normas",
      "paragrafos": [
        "Desenvolvimento aprofundado da tese jurídica com base na legislação (CC, CPC, CDC, etc.)...",
        "Parágrafo demonstrando como os fatos se subsumem à norma e à ratio decidendi dos tribunais superiores..."
      ],
      "citacaoDestaque": "Art. X da Lei Y ou Precedente STF/STJ aplicado de forma contextualizada"
    },
    {
      "subtitulo": "2. Do Dano e do Dever de Indenizar / Da Obrigação",
      "paragrafos": [
        "Fundamentação sobre a responsabilidade civil, nexo causal e extensão dos danos com base na jurisprudência aplicável..."
      ]
    }
  ],
  "pedidos": [
    { "alinea": "a", "texto": "A concessão dos benefícios da assistência judiciária gratuita, nos termos do art. 98 do CPC;" },
    { "alinea": "b", "texto": "A citação da parte Ré para, querendo, apresentar contestação no prazo legal, sob pena de revelia;" },
    { "alinea": "c", "texto": "A total PROCEDÊNCIA dos pedidos para condenar a Ré..." },
    { "alinea": "d", "texto": "A condenação da Ré ao pagamento das custas processuais e honorários advocatícios sucumbenciais (art. 85, § 2º, CPC);" }
  ],
  "fechamento": {
    "provas": "Protesta provar o alegado por todos os meios de prova em direito admitidos, em especial documental, testemunhal, pericial e o depoimento pessoal do representante da Ré.",
    "valorCausa": "R$ [Valor da Causa]",
    "localData": "[Local], [Data]",
    "advogado": {
      "nome": "[Nome do Advogado]",
      "oab": "OAB/[UF] [Número]"
    }
  }
}

REGRAS RÍGIDAS CONTRA ALUCINAÇÃO E SEGURANÇA JURÍDICA (100% GROUNDING):
1. FUNDAMENTAÇÃO SUBSTANTIVA E NÃO APENAS CITAÇÃO LITERAL:
   - Jamais apenas transcreva dispositivos legais ou súmulas em bloco. Desenvolva o argumento contextualizando como a ratio decidendi do julgado ou súmula se amolda perfeitamente à situação fática do autor.
   - NUNCA invente números de acórdãos, números de RE, REsp, ADI, nomes de ministros/relatores inexistentes ou ementas forjadas. Use apenas precedentes reais e vigentes da base de conhecimento.
2. VERACIDADE LEGAL ESTATUTÁRIA:
   - Cite exclusivamente artigos, parágrafos e incisos de diplomas legais reais e em vigor no Brasil (CF/88, CPC/15, CC/02, CDC, CLT, etc.). Nunca invente números de artigos ou leis inexistentes.
3. GROUNDING ESTRITO NOS FATOS:
   - Limite-se estritamente aos fatos e contexto narrados pelo usuário. NÃO invente dados de partes, testemunhas, endereços, valores, datas ou fatos adicionais que não constem na narrativa.
   - Para qualquer dado ausente, use SEMPRE marcadores padronizados entre colchetes: [NOME DO AUTOR], [CPF/CNPJ], [VALOR DA CAUSA], [COMARCA/ESTADO], etc.
4. RIGOR TÉCNICO FORENSE:
   - A seção 'direito' deve conter múltiplos subtópicos com argumentação sólida, nexo causal e subsunção fático-jurídica impecável.
5. Não inclua markdown na resposta.
`;

    const prompt = `Fatos narrados para a elaboração da petição:\n${facts}`;

    const isGroq = modelName.includes("llama") || modelName.includes("mixtral") || modelName.includes("gemma") || modelName.includes("openai/");

    let resultStream: any;

    if (isGroq) {
      if (!groqKey) throw new Error("GROQ_API_KEY não está definida para usar os modelos Groq.");
      const groq = new Groq({ apiKey: groqKey });
      resultStream = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        model: modelName,
        response_format: { type: "json_object" },
        max_tokens: 4096,
        temperature: 0.1,
        stream: true,
      });
    } else {
      if (!apiKey) throw new Error("GEMINI_API_KEY não está definida para usar os modelos Gemini.");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
          temperature: 0.1,
        }
      });
      const result = await model.generateContentStream(prompt);
      resultStream = result.stream;
    }

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        let accumulated = "";

        const safeClose = () => {
          if (!closed) {
            closed = true;
            controller.close();
          }
        };

        const safeError = (e: unknown) => {
          if (!closed) {
            closed = true;
            // Flush whatever we have before closing so the client can retry from here
            if (accumulated) {
              try { controller.enqueue(new TextEncoder().encode(accumulated)); } catch {}
            }
            controller.close(); // Close gracefully instead of erroring
          }
        };

        try {
          if (isGroq) {
            for await (const chunk of resultStream) {
              if (closed) break;
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                accumulated += content;
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
          } else {
            for await (const chunk of resultStream) {
              if (closed) break;
              const chunkText = chunk.text();
              if (chunkText) {
                accumulated += chunkText;
                controller.enqueue(new TextEncoder().encode(chunkText));
              }
            }
          }
          safeClose();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`Stream generation error (${modelName}):`, msg);
          safeError(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Document API Error:", message);

    // Enviar alerta de erro via Telegram
    sendTelegramAlert(
      `🔴 *SmartDoc — Falha na Geração da Petição*\n\n` +
      `*Erro:* \`${message}\`\n` +
      `*Horário:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
    ).catch(console.error);

    return NextResponse.json({ error: message || "Erro ao gerar o documento." }, { status: 500 });
  }
}
