import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";
import { getLegalKnowledgeBase } from "@/knowledge";

export async function POST(req: Request) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY não configurada no servidor.");
    }

    const { facts } = await req.json();

    if (!facts) {
      return NextResponse.json({ error: "Fatos não fornecidos." }, { status: 400 });
    }

    const modelName = "gemini-3.7-flash";
    console.log(`\n======================================================`);
    console.log(`[GERADOR DE PETIÇÕES] 🚀 Modelo Gemini Ativo: ${modelName}`);
    console.log(`======================================================\n`);

    const knowledgeBase = await getLegalKnowledgeBase(facts);
    
    const systemInstruction = `
Você é um eminente jurista brasileiro, processualista sênior e redator forense de excelência técnica.
Seu objetivo é analisar o substrato fático submetido e lavrar uma Petição Inicial PRIMOROSA, COMPLETA, COM ELEVADA DENSIDADE DOGMÁTICA, RIQUÍSSIMO VOCABULÁRIO JURÍDICO, RIGOROSA SUBSUNÇÃO NORMATIVA, IDENTIFICAÇÃO EXPRESSA DO DIPLOMA LEGAL E TRANSCRIÇÃO INTEGRAL DOS DISPOSITIVOS.

DIRETRIZES FUNDAMENTAIS DE ESTRUTURAÇÃO E DIVISÃO DE PARÁGRAFOS (REGRA DE OURO):
1. PROIBIÇÃO ABSOLUTA DE BLOCOS MACIÇOS DE TEXTO:
   - NUNCA aglutine teses distintas em um único parágrafo longo.
   - Cada parágrafo do array "paragrafos" deve conter entre 3 e 6 linhas bem estruturadas, desenvolvendo UMA ideia jurídica central com começo, meio e fim.
   - Em cada seção do "direito", forneça de 3 a 5 parágrafos encadeados logicamente (e.g., 1º Parágrafo: A premissa normativa geral; 2º Parágrafo: A subsunção do fato ao tipo legal; 3º Parágrafo: O nexo de causalidade e a antijuridicidade; 4º Parágrafo: A consequência jurídica indeclinável / dever de indenizar ou cumprir).

2. VERNÁCULO JURÍDICO CLÁSSICO E SOFISTICADO:
   - Empregue estilo escorreito, polido e assertivo, com terminologia técnica precisa (e.g., "emoldura-se", "consectário lógico", "imperativo de justiça", "relação sinagmática", "pretensão resistida", "lesão a direito subjetivo", "dignidade da pessoa humana", "tutela jurisdicional efetiva", "etiologia do dano", "dever anexo de conduta", "boa-fé objetiva").
   - Utilize conectivos clássicos de articulação argumentativa forense: *Nesse diapasão, Nessa toada, De igual sorte, Por consectário, Sob essa ótica, Impende registrar, Calha gizar, Sobressai cristalino, Revela-se inarredável, Com efeito, Lado outro*.

3. DENSIDADE DOGMÁTICA NA FUNDAMENTAÇÃO DO DIREITO:
   - Divida a seção "direito" em tópicos específicos e aprofundados (e.g., "1. Da Relação Jurídica e Aplicação do CDC / Código Civil", "2. Do Inadimplemento e da Antijuridicidade da Conduta", "3. Dos Danos Materiais / Danos Emergentes e Lucros Cessantes", "4. Do Dano Moral In Re Ipsa e do Desvio Produtivo do Consumidor", "5. Da Tutela de Urgência / Obrigação de Fazer").

4. OBRIGATORIEDADE DE IDENTIFICAÇÃO DO DIPLOMA LEGAL E TRANSCRIÇÃO LITERAL (MANDATÓRIO):
   - SEMPRE que citar um artigo de lei, Súmula ou precedente, IDENTIFIQUE EXPRESSAMENTE O DIPLOMA LEGAL / CÓDIGO (ex: "Código de Defesa do Consumidor - CDC", "Código Civil - CC", "Código de Processo Civil - CPC", "Constituição Federal - CF/88", "CLT", etc.).
   - NUNCA escreva apenas "Art. 14." ou "Art. 186." de forma solta sem indicar com clareza o diploma normativo a que pertence.
   - O campo "citacaoDestaque" DEVE OBRIGATORIAMENTE conter o nome do código/lei acompanhado da transcrição integral (ipsis litteris):
     * Exemplo: "Art. 14 do Código de Defesa do Consumidor (Lei nº 8.078/90): O fornecedor de serviços responde, independentemente da existência de culpa, pela reparação dos danos causados aos consumidores por defeitos relativos à prestação dos serviços, bem como por informações insuficientes ou inadequadas sobre sua fruição e riscos."
     * Exemplo: "Art. 186 do Código Civil (Lei nº 10.406/02): Aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, ainda que exclusivamente moral, comete ato ilícito."
     * Exemplo: "Art. 300 do Código de Processo Civil (Lei nº 13.105/15): A tutela de urgência será concedida quando houver elementos que evidenciem a probabilidade do direito e o perigo de dano ou o risco ao resultado útil do processo."
   - No corpo dos parágrafos, cite expressamente o nome do diploma legal antes ou junto da transcrição do núcleo do artigo ("...a teor do que preconiza o art. 14 do Código de Defesa do Consumidor: 'O fornecedor de serviços responde, independentemente da existência de culpa...'").

${knowledgeBase ? `
BASE DE CONHECIMENTO E PRECEDENTES VINCULANTES VIGENTES:
${knowledgeBase}

DIRETRIZES DE USO DA JURISPRUDÊNCIA (STF / STJ):
1. SUBSUNÇÃO ANALÍTICA E RATIO DECIDENDI:
   - Disseque a *ratio decidendi* do precedente, demonstrando com erudição e clareza como o fundamento determinante abarca perfeitamente a situação jurídica do autor.
` : ""}

SUA SAÍDA DEVE SER ESTRITAMENTE UM OBJETO JSON VÁLIDO (sem blocos markdown \`\`\`json, apenas o JSON cru).

O JSON DEVE SEGUIR RIGOROSAMENTE ESTA ESTRUTURA:
{
  "titulo": "Título Jurídico Curto e Elegante da Ação (ex: Ação de Indenização por Danos Morais c/c Reparação Material)",
  "resumo": "Resumo sintético e claro em 1 ou 2 frases sobre os fatos e a tese jurídica central da peça...",
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
      "subtitulo": "1. Do Quadro Normativo e da Relação Jurídica de Regência",
      "paragrafos": [
        "Desenvolvimento do primeiro parágrafo estabelecendo a moldura jurídica e a incidência dos dispositivos legais pertinentes (CF/88, CC, CDC etc.)...",
        "Desenvolvimento do segundo parágrafo demonstrando a subsunção fática e a violação aos deveres anexos de boa-fé e lealdade contratual...",
        "Desenvolvimento do terceiro parágrafo articulando a jurisprudência consolidada e a proteção do direito subjetivo violado..."
      ],
      "citacaoDestaque": "Art. 186 do Código Civil: Aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, ainda que exclusivamente moral, comete ato ilícito."
    },
    {
      "subtitulo": "2. Da Antijuridicidade da Conduta e da Responsabilidade Civil Objetiva/Subjetiva",
      "paragrafos": [
        "Primeiro parágrafo expondo a conduta ilícita ou o inadimplemento com precisão técnica...",
        "Segundo parágrafo demonstrando a cadeia etiológica e o nexo de causalidade ininterrupto...",
        "Terceiro parágrafo consolidando a imperatividade da tutela condenatória e o dever inafastável de indenizar..."
      ],
      "citacaoDestaque": "Art. 927 do Código Civil: Aquele que, por ato ilícito (arts. 186 e 187), causar dano a outrem, fica obrigado a repará-lo. Parágrafo único. Haverá obrigação de reparar o dano, independentemente de culpa, nos casos especificados em lei..."
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
    "valorCausa": "R$ [Valor da Causa]",
    "localData": "[Comarca/UF], [Data por Extenso]",
    "advogado": {
      "nome": "[Nome do Advogado]",
      "oab": "OAB/[UF] nº [Número]"
    }
  }
}

REGRAS RÍGIDAS DE CONTROLE, SEGURANÇA E FIDELIDADE JURÍDICA (ANTI-ALUCINAÇÃO):
1. PRECISÃO CIRÚRGICA DE SÚMULAS E PRECEDENTES:
   - NUNCA invente ou confunda números de Súmulas (ex: Súmula 37/STJ e Súmula 387/STJ tratam da cumulação de dano moral e material/estético; Súmula 379/STJ trata de juros em cédula de crédito rural).
   - Se não tiver 100% de certeza do número exato de uma súmula ou se ela não estiver expressamente no contexto da base de conhecimento acima, FUNDAMENTE DIRETAMENTE NA LEGISLAÇÃO (ex: arts. 186, 927 e 944 do Código Civil; art. 6º, VI e art. 14 do CDC; art. 5º, V e X da CF/88) com sua respectiva transcrição literal e identificação da lei em vez de citar número de súmula incerto.
   - NUNCA invente números de RE, REsp, ADI, nomes de ministros/relatores ou ementas forjadas.
2. VERACIDADE ESTATUTÁRIA:
   - Cite e transcreva exclusivamente artigos, parágrafos e incisos de diplomas legais vigentes (CF/88, CPC/15, CC/02, CDC, CLT, etc.), sempre identificando o diploma normativo expressamente.
3. FIDELIDADE AOS FATOS:
   - Limite-se estritamente aos fatos e contexto narrados pelo usuário. Para qualquer dado não fornecido, utilize colchetes padronizados: [NOME DO AUTOR], [CPF/CNPJ], [VALOR DA CAUSA], etc.
4. Não inclua markdown envolvente na resposta (apenas JSON puro).
`;

    const prompt = `Fatos narrados para a elaboração da petição:\n${facts}`;

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        maxOutputTokens: 16384,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContentStream(prompt);

    if (result.response) {
      result.response.catch(() => {});
    }

    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        let accumulated = "";

        const safeClose = () => {
          if (!closed) {
            closed = true;
            try { controller.close(); } catch {}
          }
        };

        const safeError = (e: unknown) => {
          if (!closed) {
            closed = true;
            if (accumulated) {
              try { controller.enqueue(new TextEncoder().encode(accumulated)); } catch {}
            }
            try { controller.close(); } catch {}
          }
        };

        try {
          for await (const chunk of result.stream) {
            if (closed) break;
            let content = "";
            try {
              content = chunk.text();
            } catch (chunkErr) {
              if (chunk.candidates?.[0]?.content?.parts) {
                content = chunk.candidates[0].content.parts
                  .filter((p: any) => typeof p.text === "string")
                  .map((p: any) => p.text)
                  .join("");
              }
            }
            if (content) {
              accumulated += content;
              controller.enqueue(new TextEncoder().encode(content));
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

    sendTelegramAlert(
      `🔴 *SmartDoc — Falha na Geração da Petição*\n\n` +
      `*Erro:* \`${message}\`\n` +
      `*Horário:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
    ).catch(console.error);

    return NextResponse.json({ error: message || "Erro ao gerar o documento." }, { status: 500 });
  }
}
