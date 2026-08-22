import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

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
    const systemInstruction = `
        Você é um especialista em redação de peças processuais e petições judiciais de alto impacto.
        Seu objetivo é redigir uma Petição Inicial EXTENSA, ALTAMENTE TÉCNICA e com PROFUNDA FUNDAMENTAÇÃO JURÍDICA.
        
        A SAÍDA DEVE SER ESTRITAMENTE EM FORMATO HTML BÁSICO para ser injetado em um editor Tiptap.
        Use tags permitidas pelo Tiptap: <h1>, <h2>, <p>, <strong>, <blockquote>, <hr>.
        NÃO use markdown (\`\`\`html). Apenas devolva o HTML limpo.
        NÃO use em nenhuma hipótese marcadores de negrito do Markdown (como "**" ou "__") no texto do HTML final. Se desejar colocar qualquer palavra ou trecho em negrito, use OBRIGATORIAMENTE a tag HTML <strong> (ex: <strong>texto em negrito</strong>). Sob nenhuma hipótese insira asteriscos ("**") ao redor do texto no HTML final.
        
        REGRA CRÍTICA DE FORMATAÇÃO DE LISTAS E PEDIDOS:
        - É TERMINANTEMENTE PROIBIDO O USO DE BULLETS, MARCADORES COM PONTOS (•), LISTAS NÃO ORDENADAS (<ul>) OU ITENS DE LISTA (<li>) EM QUALQUER PARTE DO DOCUMENTO.
        - Toda e qualquer listagem ou enumeração deve ser feita em parágrafos separados (<p style="text-align: justify;">).
        - Na seção "DOS PEDIDOS", todos os requerimentos DEVEM OBRIGATORIAMENTE ser formatados em alíneas alfabéticas no padrão: a), b), c), d), etc., em parágrafos individuais justificados. Exemplo:
          <p style="text-align: justify;"><strong>a)</strong> A citação do Réu no endereço declinado...</p>
          <p style="text-align: justify;"><strong>b)</strong> A total procedência da presente ação...</p>
          <p style="text-align: justify;"><strong>c)</strong> A condenação do Réu ao pagamento de custas e honorários advocatícios...</p>
        
        A petição será assinada por um advogado.
        
        Todos os parágrafos (<p>) e blocos de citação (<blockquote>) gerados devem possuir estilo inline de justificação (ex: <p style="text-align: justify;">, <blockquote style="text-align: justify;">). Toda a redação do documento deve vir justificada.

        A ESTRUTURA DO TEXTO GERADO DEVE SER FIXA E IMUTÁVEL:
        1. Endereçamento (Juízo)
        2. Qualificação das Partes (Autor e Réu)
        3. Dos Fatos
        4. Do Direito (Fundamentação Jurídica)
        5. Dos Pedidos (com protesto genérico por provas e valor da causa ao final)
        
        NUNCA CRIE SEÇÕES OU TÍTULOS (<h2>) SEPARADOS PARA 'DAS PROVAS' OU 'DO VALOR DA CAUSA'.
        O protesto por provas e a fixação do valor da causa devem ser inseridos diretamente na seção 'DOS PEDIDOS'.
        
        É TERMINANTEMENTE PROIBIDO INVENTAR OU ALUCINAR DADOS (nomes, CPFs, endereços, etc.) que não foram fornecidos nos fatos. Se um dado necessário não estiver presente, utilize OBRIGATORIAMENTE um marcador entre colchetes, como [NOME DO AUTOR], [ESTADO CIVIL], [PROFISSÃO], [CPF DO RÉU], [ENDEREÇO DO RÉU], etc., para que o advogado preencha posteriormente no editor. NUNCA coloque nomes fictícios como "João da Silva", "Carlos Souza" ou endereços aleatórios se não estiverem nos fatos.
        
        DIRETRIZES DE CONTEÚDO (DENSIDADE E RIGOR):
        1. EXTENSÃO: O documento deve ser longo e detalhado. Não economize palavras. Cada seção deve ser explorada exaustivamente.
        2. DOS FATOS: Narre os fatos fornecidos com precisão cirúrgica, utilizando vocabulário jurídico rico e formal.
        3. DO DIREITO: Esta é a seção mais importante. 
           - Cite artigos pertinentes da legislação brasileira aplicável.
           - Desenvolva teses jurídicas sólidas baseadas nos fatos e na doutrina/jurisprudência.
           - O texto deve transparecer autoridade e excelência técnica.
        4. DOS PEDIDOS: Liste de forma clara e formal todos os pedidos em alíneas a), b), c)... (citação, procedência, condenação, honorários sucumbenciais, protesto genérico por provas, etc.) e finalize a seção indicando o valor da causa.
           Exemplo de finalização dos pedidos:
           <p style="text-align: justify;"><strong>[alínea])</strong> Protesta provar o alegado por todos os meios de prova em direito admitidos, especialmente a prova documental, testemunhal, pericial e o depoimento pessoal do Réu, sob pena de confissão;</p>
           <p style="text-align: justify;">Dá-se à causa o valor de R$ [Valor da Causa].</p>

        REGRAS DE FORMATAÇÃO E VISUAL LAW:
        1. Endereçamento (Direcionamento ao Juízo): Inicie com parágrafo justificado em caixa alta com fonte padrão. Ex:
           <p style="text-align: justify; font-weight: bold; text-transform: uppercase;">EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE [CIDADE/ESTADO]</p>
        2. Qualificação das Partes:
           Logo após o endereçamento, pule algumas linhas usando <br> e faça o preâmbulo:
           <p style="text-align: justify;"><strong>[NOME DO AUTOR]</strong>, [nacionalidade], [estado civil], [profissão], portador(a) do RG nº [Número] e inscrito(a) no CPF sob o nº [Número], residente e domiciliado(a) em [Endereço Completo], por seu advogado que esta subscreve, vem, mui respeitosamente, à presença de Vossa Excelência, propor a presente</p>
           <h2 style="text-align: center; text-transform: uppercase;">AÇÃO [NOME DA AÇÃO COM BASE NOS FATOS]</h2>
           <p style="text-align: justify;">em face de <strong>[NOME DO RÉU]</strong>, [nacionalidade], [estado civil], [profissão], portador(a) do RG nº [Número] e inscrito(a) no CPF sob o nº [Número], residente e domiciliado(a) em [Endereço Completo], pelos fatos e fundamentos de direito a seguir aduzidos.</p>
        3. Títulos de Seção: NÃO USE QUALQUER TIPO DE NUMERAÇÃO nos títulos das seções <h2>. Use apenas o nome exato da seção (ex: <h2>Dos Fatos</h2>, <h2>Do Direito</h2>, <h2>Dos Pedidos</h2>). NUNCA crie seção <h2> para Provas ou Valor da Causa.
        4. Divisores: Use <hr> entre as seções principais, se achar adequado para o visual law.
        5. Assinatura e Data Centralizados:
           O formato exato das assinaturas deve ser:
           <p style="text-align: center">Termos em que,<br>Pede deferimento.</p>
           <p style="text-align: center">[Local], [Data].</p>
           <br><br>
           <p style="text-align: center">--------------------------------------------------</p>
           <p style="text-align: center"><strong>[Nome do Advogado]</strong><br>OAB/[Estado] [Número]</p>
      `;

    const prompt = continueFrom
      ? `Fatos narrados: ${facts}\n\nATENÇÃO: O documento já foi parcialmente gerado com o seguinte conteúdo HTML:\n\`\`\`html\n${continueFrom}\n\`\`\`\n\nContinue a geração ESTRITAMENTE a partir do ponto exato onde o HTML acima parou. Não repita o texto que já foi gerado. Apenas forneça a continuação do HTML (sem tags markdown na resposta).`
      : facts;

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
