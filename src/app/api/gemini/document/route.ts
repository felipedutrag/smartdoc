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
      "gemini-2.5-flash",        // Tentativa 0 (Principal - Gemini 2.5 Flash)
      "gemini-2.5-pro",          // Tentativa 1 (Fallback Gemini Pro)
      "openai/gpt-oss-120b",     // Tentativa 2 (Fallback Groq GPT-OSS 120B)
      "llama-3.3-70b-versatile", // Tentativa 3 (Fallback Groq Llama 3.3 70B)
      "gemini-3.0-flash",        // Tentativa 4 (Fallback Gemini 3.0 Flash)
    ];
    
    const modelName = fallbackModels[attempt] || "gemini-2.5-flash";
    const knowledgeBase = getLegalKnowledgeBase(facts);
    
    const systemInstruction = `
Você é um eminente jurista brasileiro, processualista sênior e redator forense de excelência técnica.
Seu objetivo é analisar o substrato fático submetido e lavrar uma Petição Inicial PRIMOROSA, COMPLETA, COM ELEVADA DENSIDADE DOGMÁTICA, RIQUÍSSIMO VOCABULÁRIO JURÍDICO E RIGOROSA SUBSUNÇÃO NORMATIVA.

DIRETRIZES ESTILÍSTICAS E DE REDAÇÃO FORENSE:
1. VERNÁCULO JURÍDICO CLÁSSICO E SOFISTICADO:
   - Empregue estilo escorreito, polido e assertivo, com terminologia técnica precisa (e.g., "emoldura-se", "consectário lógico", "imperativo de justiça", "relação sinagmática", "pretensão resistida", "lesão a direito subjetivo", "dignidade da pessoa humana", "tutela jurisdicional efetiva").
   - Utilize conectivos clássicos de articulação argumentativa forense: *Nesse diapasão, Nessa toada, De igual sorte, Por consectário, Sob essa ótica, Impende registrar, Calha gizar, Sobressai cristalino, Revela-se inarredável*.
   - Estruture a argumentação em silogismos impecáveis (Premissa Maior: a norma e a tese dos tribunais superiores; Premissa Menor: o evento fático lesivo; Conclusão: a obrigação inafastável de indenizar / adimplir / acolher o pedido).

${knowledgeBase ? `
BASE DE CONHECIMENTO E PRECEDENTES VINCULANTES VIGENTES:
${knowledgeBase}

DIRETRIZES DE USO DA JURISPRUDÊNCIA (STF / STJ):
1. SUBSUNÇÃO ANALÍTICA E RATIO DECIDENDI (NÃO TRANSCREVER MECANICAMENTE):
   - Jamais se limite a colar ementas desprovidas de contexto.
   - Disseque a *ratio decidendi* do precedente, demonstrando com erudição e clareza como o fundamento determinante consagrado pelo STF/STJ abarca perfeitamente a situação jurídica do autor e afasta teses contrárias.
   - Faça referência solene aos julgados (e.g., "Em julgamento paradigmático de Repercussão Geral sob o Tema X, o Pretório Excelso firmou o entendimento de que...", "Nesse sentido, a jurisprudência sumulada da Suprema Corte sedimentou...").
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
      "qualificacao": "[nacionalidade], [estado civil], [profissão], portador(a) da cédula de identidade RG nº [Número], inscrito(a) no CPF/ME sob o nº [Número], residente e domiciliado(a) na [Endereço Completo], com endereço eletrônico [E-mail]"
    },
    "tipoAcao": "AÇÃO [NOME TÉCNICO EXATO DA AÇÃO CONFORME O DIREITO MATERIAL/PROCESSUAL]",
    "reu": {
      "nome": "[NOME DO RÉU]",
      "qualificacao": "[nacionalidade/qualificação societária], pessoa jurídica de direito privado inscrita no CNPJ sob o nº [Número], com sede na [Endereço Completo], endereço eletrônico [E-mail]"
    }
  },
  "fatos": [
    "Parágrafo 1 detalhando o início da relação e histórico fático com riqueza descritiva...",
    "Parágrafo 2 evidenciando o ilícito perpetrado, inadimplemento ou ato gerador de responsabilidade...",
    "Parágrafo 3 pormenorizando a extensão dos prejuízos suportados e a frustração das tentativas amigáveis..."
  ],
  "direito": [
    {
      "subtitulo": "1. Da Relação Jurídica e do Quadro Normativo Aplicável",
      "paragrafos": [
        "Articulação doutrinária e legal densa acerca da incidência dos institutos de regência (CF/88, CC, CDC, CPC, CLT etc.)...",
        "Desenvolvimento do nexo fático-substantivo demonstrando a subsunção cristalina dos fatos à proteção legal e à ratio decidendi dos Tribunais Superiores..."
      ],
      "citacaoDestaque": "Dispositivo legal ou Precedente vinculante STF/STJ devidamente contextualizado"
    },
    {
      "subtitulo": "2. Do Dever Jurídico e da Responsabilidade Civil / Obrigacional",
      "paragrafos": [
        "Exposição robusta sobre a antijuridicidade da conduta da Ré, a configuração do dano injusto e a imperatividade da tutela condenatória..."
      ]
    }
  ],
  "pedidos": [
    { "alinea": "a", "texto": "A concessão da gratuidade da justiça, ex vi do art. 98 do Código de Processo Civil, por ser a parte Autora hipossuficiente na acepção jurídica do termo;" },
    { "alinea": "b", "texto": "A citação da parte Ré, no endereço preambularmente declinado, para, querendo, apresentar resposta à presente demanda no prazo legal, sob pena de revelia e confissão ficta;" },
    { "alinea": "c", "texto": "O julgamento de TOTAL PROCEDÊNCIA dos pedidos deduzidos na presente exordial, para condenar a Ré a..." },
    { "alinea": "d", "texto": "A condenação da Demandada ao pagamento integral das despesas processuais e honorários advocatícios sucumbenciais, nos termos do art. 85, § 2º, do CPC;" }
  ],
  "fechamento": {
    "provas": "Protesta provar o alegado por todos os meios de prova em direito admitidos, sem exceção de nenhum, notadamente documental, testemunhal, pericial e o depoimento pessoal do representante legal da Ré.",
    "valorCausa": "Dá-se à causa o valor de R$ [Valor da Causa]",
    "localData": "[Comarca/UF], [Data por Extenso]",
    "advogado": {
      "nome": "[Nome do Advogado]",
      "oab": "OAB/[UF] nº [Número]"
    }
  }
}

REGRAS RÍGIDAS DE CONTROLE E SEGURANÇA JURÍDICA:
1. DIALÉTICA E ELEGÂNCIA ARGUMENTATIVA:
   - Evite frases curtas e telegráficas. Desenvolva argumentos sólidos, demonstrando erudição, autoridade jurídica e fluência vocabular.
   - NUNCA invente números de acórdãos, números de RE, REsp, ADI, nomes de relatores inexistentes ou ementas forjadas. Use apenas precedentes reais e vigentes.
2. VERACIDADE ESTATUTÁRIA:
   - Cite exclusivamente artigos, parágrafos e incisos de diplomas legais vigentes (CF/88, CPC/15, CC/02, CDC, CLT, etc.).
3. FIDELIDADE AOS FATOS:
   - Limite-se estritamente aos fatos e contexto narrados pelo usuário. Para qualquer dado não fornecido, utilize colchetes padronizados: [NOME DO AUTOR], [CPF/CNPJ], [VALOR DA CAUSA], etc.
4. Não inclua markdown envolvente na resposta (apenas JSON puro).
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
        temperature: 0.3,
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
          temperature: 0.3,
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
