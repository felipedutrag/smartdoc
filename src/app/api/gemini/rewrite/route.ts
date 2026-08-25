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

      REGRAS CRÍTICAS PARA A SAÍDA (FORMATO NODE-BASED CIRÚRGICO):
      1. Você NÃO DEVE retornar o documento inteiro. Retorne APENAS as tags <update> referentes aos blocos que sofrerem modificação, inserção ou exclusão.
      2. O atributo 'id' da tag <update> deve ser OBRIGATORIAMENTE o mesmo 'id' do nó de referência existente no HTML (ex: id="node-abc123").
      
      3. COMO REALIZAR CADA TIPO DE OPERAÇÃO:
         A) MODIFICAR/SUBSTITUIR UM PARÁGRAFO EXISTENTE:
            - Retorne a tag <update id="ID_DO_NÓ"> com o parágrafo modificado:
            <update id="node-12345678">
              <p id="node-12345678" style="text-align: justify;">Texto que permaneceu <mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px; font-weight: 600;">trecho modificado ou adicionado</mark>.</p>
            </update>

         B) ADICIONAR UM NOVO PARÁGRAFO ABAIXO DE UM BLOCO EXISTENTE:
            - Envolva na tag <update id="ID_DO_BLOCO_ANTERIOR"> o bloco anterior inalterado SEGUIDO do novo parágrafo:
            <update id="node-12345678">
              <p id="node-12345678" style="text-align: justify;">Texto do parágrafo anterior inalterado...</p>
              <p id="node-novo-123" style="text-align: justify;"><mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px; font-weight: 600;">Conteúdo do novo parágrafo inserido com sucesso...</mark></p>
            </update>

         C) ADICIONAR UM NOVO PEDIDO OU ALÍNEA NOS PEDIDOS:
            - Localize o último pedido existente ou a seção 'III. DOS PEDIDOS' e insira a nova alínea logo abaixo:
            <update id="node-ultimo-pedido">
              <p id="node-ultimo-pedido" style="text-align: justify;"><strong>c)</strong> Pedido anterior...</p>
              <p id="node-novo-pedido" style="text-align: justify;"><strong>d)</strong> <mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px; font-weight: 600;">A condenação da ré em obrigação de fazer...</mark></p>
            </update>

         D) EXCLUIR / REMOVER UM PARÁGRAFO:
            - Use a tag <update id="ID_DO_BLOCO" action="delete"></update> ou <update id="ID_DO_BLOCO" delete="true"></update> vazia.

      4. REGRAS CRÍTICAS PARA "DIFF VISUAL":
         - Dentro do conteúdo modificado ou novo, envolva o trecho alterado/inserido na tag:
           <mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px; font-weight: 600;">texto novo ou modificado</mark>
         - Todo parágrafo <p> deve possuir style="text-align: justify;".

      5. REGRAS RÍGIDAS DE IDENTIFICAÇÃO DE LOCAL:
         - Analise o contexto semântico da instrução (ex: "adicione aos fatos", "coloque nos pedidos", "mude o valor da causa", "acrescente na fundamentação do dano moral", "abaixo do parágrafo sobre o contrato") para eleger com precisão o id do bloco alvo.
         - NUNCA invente julgados ou números de leis inexistentes.
         - NÃO inclua markdown (como \`\`\`html) ou comentários conversacionais. Apenas as tags <update>.
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
