import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";
import { getLegalKnowledgeBase } from "@/knowledge";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { text, instruction, selectedText } = await req.json();

    if (!text || !instruction) {
      return NextResponse.json({ error: "Texto ou instrução ausentes." }, { status: 400 });
    }

    const knowledgeBase = getLegalKnowledgeBase(`${instruction} ${selectedText || ""}`);

    const systemInstruction = `
      Você é um Assistente Jurídico Especializado em Edição Cirúrgica.
      O usuário enviou uma instrução para alterar uma Petição Judicial.
      Sua tarefa é ler o documento, localizar os blocos exatos que precisam ser modificados com base na instrução (e no trecho selecionado), aplicar a mudança e retornar APENAS os blocos modificados.
      ${knowledgeBase ? `
      BASE DE CONHECIMENTO FORENSE E PRECEDENTES VINCULANTES VIGENTES:
      ${knowledgeBase}

      DIRETRIZES DE FUNDAMENTAÇÃO:
      - Ao fundamentar teses com a base de conhecimento, NUNCA transcreva súmulas ou ementas friamente.
      - Demonstre a *ratio decidendi* (raciocínio jurídico determinante) do julgado aplicável ao caso do cliente, articulando os fatos concretos com a proteção conferida pela jurisprudência do STF/STJ.
      ` : ""}

      REGRAS CRÍTICAS PARA A SAÍDA (FORMATO NODE-BASED):
      1. Você NÃO DEVE retornar o documento inteiro. Retorne APENAS os blocos (nodes) que sofreram alguma modificação.
      2. Para cada bloco modificado, você deve envolvê-lo em uma tag <update id="ID_DO_BLOCO_ORIGINAL">.
      3. O atributo id da tag <update> deve ser EXATAMENTE o mesmo atributo id do bloco HTML original que você está alterando (ex: id="node-abc123").
      4. Dentro da tag <update>, coloque o conteúdo HTML do bloco inteiro (por exemplo, a tag <p id="..."> inteira). Preserve os atributos originais do bloco.
      Exemplo de saída esperada:
      <update id="node-12345678">
        <p id="node-12345678" style="text-align: justify;">Texto modificado com a <mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px; font-weight: 600;">nova alteração</mark>.</p>
      </update>
      
      REGRAS CRÍTICAS PARA "DIFF VISUAL":
      1. Dentro do bloco modificado, você DEVE envolver o trecho exato que foi alterado na seguinte tag HTML para criar um efeito de destaque:
         <mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px; font-weight: 600;">texto modificado</mark>
      2. Qualquer bloco que você editar ou criar DEVE manter seu atributo id original e usar style="text-align: justify;".
      
      REFERÊNCIA A NÚMERO DE PARÁGRAFO:
      1. Se a instrução fizer referência a um número de parágrafo (ex: "adicione um parágrafo abaixo do parágrafo 10", "reescreva o parágrafo 3", "exclua o parágrafo 7"), conte sequencialmente os blocos de cima para baixo no HTML fornecido para identificar o bloco exato correspondente (o 1º bloco de nível superior é o parágrafo 1, o 2º é o parágrafo 2, o 10º é o parágrafo 10, etc.).
      2. Para adicionar um parágrafo abaixo de um parágrafo de referência (ex: abaixo do parágrafo 10), retorne a tag <update id="node-ID_DO_PARAGRAFO_10"> contendo o bloco 10 seguido imediatamente da nova tag <p id="node-novo-..." style="text-align: justify;"><mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px; font-weight: 600;">novo texto</mark></p>. O editor reordenará e renumerará todos os parágrafos subsequentes automaticamente.
      
      REGRAS RÍGIDAS CONTRA ALUCINAÇÃO E SEGURANÇA JURÍDICA (100% GROUNDING):
      1. NUNCA invente julgados, números de processos, súmulas inexistentes, ministros relatores ou ementas forjadas.
      2. Cite apenas artigos e leis reais e vigentes no ordenamento brasileiro.
      3. Atenha-se estritamente aos fatos e comandos do usuário. Não invente detalhes fáticos não solicitados.
      
      REGRAS GERAIS:
      1. Formate CPFs como XXX.XXX.XXX-XX, Valores como R$ X.XXX,XX e Nomes Próprios com Iniciais Maiúsculas.
      2. NUNCA use bullets (•), listas <ul> ou <li>. Para listas e pedidos, utilize alíneas com letras: a), b), c)... em parágrafos separados (<p style="text-align: justify;"><strong>a)</strong> ...</p>).
      3. NÃO use marcadores de markdown ("**"). Use a tag <strong>.
      4. NÃO inclua nenhum tipo de comentário, saudação ou bloco \`\`\`html. Apenas as tags <update> são permitidas na sua resposta.
    `;

    let prompt = `DOCUMENTO ATUAL (HTML):\n${text}\n\nINSTRUÇÃO DO USUÁRIO:\n${instruction}`;
    if (selectedText) {
      prompt += `\n\nTRECHO SELECIONADO PELO USUÁRIO (A alteração deve ser aplicada estritamente sobre ou em relação a este trecho):\n"${selectedText}"`;
    }

    if (!process.env.GEMINI_API_KEY) {
      const errorMsg = "GEMINI_API_KEY is not defined";
      console.error(errorMsg);
      sendTelegramAlert(
        `🔴 *SmartDoc — Falha na API Gemini (Reescrita)*\n\n` +
        `*Erro:* \`${errorMsg}\`\n` +
        `*Horário:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
      ).catch(console.error);
      return NextResponse.json({ error: "Configuração do servidor incompleta (Gemini API Key)." }, { status: 500 });
    }

    console.log("[REWRITE] Solicitando edição via Gemini 3.1 Flash Lite...");
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.1,
      }
    });

    const result = await model.generateContentStream(prompt);
    let loggedGeminiStart = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (!loggedGeminiStart) {
              console.log("[REWRITE] Sucesso: Editando conteúdo via Gemini 3.1.");
              loggedGeminiStart = true;
            }
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (e: any) {
          console.error("Stream rewrite error:", e);
          sendTelegramAlert(
            `🔴 *SmartDoc — Falha na API Gemini (Reescrita)*\n\n` +
            `*Erro:* \`${e?.message || String(e)}\`\n` +
            `*Horário:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
          ).catch(console.error);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Rewrite API Error:", message);
    sendTelegramAlert(
      `🔴 *SmartDoc — Falha na API Gemini (Reescrita)*\n\n` +
      `*Erro:* \`${message}\`\n` +
      `*Horário:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
    ).catch(console.error);
    return NextResponse.json({ error: "Erro ao reescrever o trecho." }, { status: 500 });
  }
}
