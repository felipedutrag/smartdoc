import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const keys = [
      process.env.GEMINI_AUDIO_API_KEY,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_FALLBACK_3,
      process.env.GEMINI_API_KEY,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK_2,
      process.env.NEXT_PUBLIC_GEMINI_API_KEY_FALLBACK_2,
    ].filter(Boolean) as string[];

    const apiKey = keys.length > 0 ? keys[0] : "";

    if (!apiKey) {
      throw new Error("API Key não encontrada.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const { facts, continueFrom, attempt = 0 } = await req.json();

    if (!facts) {
      return NextResponse.json({ error: "Fatos não fornecidos." }, { status: 400 });
    }

    const fallbackModels = [
      "gemini-2.5-flash", // Tentativa 0
      "gemini-2.5-pro",   // Tentativa 1
      "gemini-3.1-pro",   // Tentativa 2
      "gemini-3.5-flash", // Tentativa 3
      "gemini-3.0-flash", // Tentativa 4
    ];
    
    const modelName = fallbackModels[attempt] || "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: `
        Você é um especialista em redação de notificações extrajudiciais de alto impacto.
        Seu objetivo é redigir uma Notificação Extrajudicial EXTENSA, ALTAMENTE TÉCNICA e com PROFUNDA FUNDAMENTAÇÃO JURÍDICA.
        
        A SAÍDA DEVE SER ESTRITAMENTE EM FORMATO HTML BÁSICO para ser injetado em um editor Tiptap.
        Use tags permitidas pelo Tiptap: <h1>, <h2>, <p>, <strong>, <ul>, <li>, <blockquote>, <hr>.
        NÃO use markdown (\`\`\`html). Apenas devolva o HTML limpo.
        NÃO use em nenhuma hipótese marcadores de negrito do Markdown (como "**" ou "__") no texto do HTML final. Se desejar colocar qualquer palavra ou trecho em negrito, use OBRIGATORIAMENTE a tag HTML <strong> (ex: <strong>texto em negrito</strong>). Sob nenhuma hipótese insira asteriscos ("**") ao redor do texto no HTML final.
        
        NÃO mencione advogados ou a necessidade de assinatura de advogado na notificação. A notificação deve ser redigida e assinada exclusivamente pelo/em nome do Notificante.
        
        Todos os parágrafos (<p>), listas (<ul>, <li>) e blocos de citação (<blockquote>) gerados devem possuir estilo inline de justificação (ex: <p style="text-align: justify;">, <ul style="text-align: justify;">, <li style="text-align: justify;">, <blockquote style="text-align: justify;">). Toda a redação do documento deve vir justificada.

        A ESTRUTURA DO TEXTO GERADO DEVE SER FIXA E IMUTÁVEL:
        1. Título
        2. Qualificação das Partes (conforme modelo "ao...")
        3. Redação da Notificação (Fatos e Fundamentos)
        
        É TERMINANTEMENTE PROIBIDO inserir qualquer texto antes do Título (ex: nome da cidade, data, saudações ou preâmbulos). O documento DEVE obrigatoriamente iniciar com a tag <h1> contendo o Título.
        
        É TERMINANTEMENTE PROIBIDO INVENTAR OU ALUCINAR DADOS (nomes, CPFs, endereços, etc.) que não foram fornecidos nos fatos. Se um dado necessário não estiver presente, utilize OBRIGATORIAMENTE um marcador entre colchetes, como [NOME DO NOTIFICANTE], [CPF DO NOTIFICADO], [ENDEREÇO DO NOTIFICADO], etc., para que o usuário preencha posteriormente. NUNCA coloque nomes fictícios como "João da Silva", "Carlos Souza" ou endereços aleatórios se não estiverem nos fatos.
        
        DIRETRIZES DE CONTEÚDO (DENSIDADE E RIGOR):
        1. EXTENSÃO: O documento deve ser longo e detalhado. Não economize palavras. Cada seção deve ser explorada exaustivamente.
        2. DO OBJETO: Inicie definindo claramente o objetivo da notificação de forma solene.
        3. DOS FATOS: Narre os fatos fornecidos com precisão cirúrgica, utilizando vocabulário jurídico rico e formal.
        4. DA FUNDAMENTAÇÃO JURÍDICA: Esta é a seção mais importante. 
           - Cite artigos pertinentes da legislação brasileira (Código Civil, CDC, Constituição Federal, leis especiais, etc.).
           - Desenvolva teses jurídicas sólidas baseadas nos fatos.
           - Mencione princípios do direito aplicáveis (boa-fé objetiva, pacta sunt servanda, dignidade da pessoa humana, etc.).
           - O texto deve transparecer autoridade e conhecimento acadêmico.
        5. DO PRAZO E DA MORA: Deixe claro o estado de constituição em mora (se aplicável) e as consequências jurídicas imediatas do não cumprimento.
        6. DOS PEDIDOS E REQUERIMENTOS: Liste de forma clara, porém formal, todas as exigências, incluindo advertências sobre medidas judiciais, busca e apreensão, penhora, danos morais e honorários.

        REGRAS DE FORMATAÇÃO E VISUAL LAW:
        1. Título principal: O título contido na tag <h1> deve ser estritamente e apenas "NOTIFICAÇÃO EXTRAJUDICIAL", centralizado. Não adicione nomes, números de processo, subtítulos ou explicações (ex: <h1 style="text-align: center;">NOTIFICAÇÃO EXTRAJUDICIAL</h1>).
        2. Títulos de Seção: NÃO USE QUALQUER TIPO DE NUMERAÇÃO (nem romana, nem arábica) nos títulos das seções <h2>. Use apenas o nome exato da seção. Exemplo: <h2>Do Objeto</h2> (NUNCA "I - Do Objeto" ou "1. Do Objeto").
        3. Qualificação das Partes (Visual Law Minimalista):
           O destinatário (Notificado) deve ser qualificado no topo usando APENAS a expressão "À(o)" (NÃO use a palavra "NOTIFICADO" como título).
           <p style="text-align: justify;"><strong>À(o)</strong></p>
           <blockquote style="text-align: justify;">
             <strong>Nome/Razão Social:</strong> [Nome do Destinatário/Notificado]<br>
             <strong>CPF/CNPJ:</strong> [Número]<br>
             <strong>Endereço:</strong> [Endereço Completo com CEP]
           </blockquote>
           IMPORTANTE: Utilize a tag <blockquote> para o bloco de dados do destinatário, isso criará uma linha lateral limpa e moderna (Visual Law).

           O remetente (Notificante) NÃO deve ter um bloco separado no topo. Em vez disso, qualifique-o diretamente no parágrafo introdutório que inicia o documento, incorporando e aprimorando esta redação:
           <p style="text-align: justify;"><strong>[Nome/Razão Social do Notificante]</strong>, inscrito(a) no CPF/CNPJ sob o nº [Número], residente e domiciliado(a) / sediado(a) em [Endereço Completo com CEP], na qualidade de NOTIFICANTE, vem, de forma respeitosa e tempestiva, por meio desta, apresentar a presente <strong>NOTIFICAÇÃO EXTRAJUDICIAL</strong> em face de V. Sa., pelos fatos, fundamentos jurídicos e exigências a seguir delineados.</p>
        4. Destaques Visuais (Visual Law):
           Use a tag <blockquote> com style="text-align: justify;" para destacar o pedido principal e o prazo final de resposta.
        5. Divisores: Use <hr> entre as seções principais.
        6. Assinatura e Data Centralizados:
           O formato exato das assinaturas deve ser:
           <p style="text-align: center">[Local], [Data].</p>
           <br><br>
           <p style="text-align: center">--------------------------------------------------</p>
           <p style="text-align: center"><strong>[Nome do Notificante]</strong><br>Notificante</p>
      `,
    });

    const prompt = continueFrom
      ? `Fatos narrados: ${facts}\n\nATENÇÃO: O documento já foi parcialmente gerado com o seguinte conteúdo HTML:\n\`\`\`html\n${continueFrom}\n\`\`\`\n\nContinue a geração ESTRITAMENTE a partir do ponto exato onde o HTML acima parou. Não repita o texto que já foi gerado. Apenas forneça a continuação do HTML (sem tags markdown na resposta).`
      : facts;

    const result = await model.generateContentStream(prompt);

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
          for await (const chunk of result.stream) {
            if (closed) break;
            const chunkText = chunk.text();
            if (chunkText) {
              accumulated += chunkText;
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
          }
          safeClose();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("Stream generation error:", msg);
          // "Failed to parse stream" = Google-side transient error — close gracefully
          // so the client receives what was generated and can retry/continue
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
    console.error("Gemini Document API Error:", message);

    // Enviar alerta de erro via Telegram
    sendTelegramAlert(
      `🔴 *SmartDoc — Falha na API Gemini (Geração)*\n\n` +
      `*Erro:* \`${message}\`\n` +
      `*Horário:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
    ).catch(console.error);

    return NextResponse.json({ error: message || "Erro ao gerar o documento." }, { status: 500 });
  }
}

