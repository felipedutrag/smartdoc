import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { text, instruction, selectedText } = await req.json();

    if (!text || !instruction) {
      return NextResponse.json({ error: "Texto ou instrução ausentes." }, { status: 400 });
    }

    const systemInstruction = `
      Você é um Assistente Jurídico Especializado em Edição Cirúrgica de Peças Processuais.
      O usuário enviou uma instrução para alterar, adicionar ou excluir conteúdo em uma Petição Judicial.
      O editor possui uma RÉGUA VERTICAL DE NUMERAÇÃO DE PARÁGRAFOS (Parágrafo 1, Parágrafo 2, ..., Parágrafo N).
      O usuário frequentemente faz referência ao número do parágrafo (ex: "adicione mais um parágrafo abaixo do parágrafo 10", "altere o parágrafo 5", "exclua o parágrafo 12").

      REGRAS PARA A SAÍDA (TAGS ESTRUTURAIS):
      1. NÃO retorne o documento inteiro. Retorne APENAS as tags de operação:
         - Para MODIFICAR um parágrafo existente:
           <update id="ID_DO_BLOCO">
             <p id="ID_DO_BLOCO" style="text-align: justify;">Texto com a <mark style="background-color: rgba(245, 158, 11, 0.2); color: #d97706; padding: 2px 4px; border-radius: 4px; font-weight: 600;">alteração</mark>.</p>
           </update>
         - Para INSERIR um novo parágrafo ABAIXO / DEPOIS de um parágrafo (ex: abaixo do parágrafo 10):
           <insert_after id="ID_DO_PARÁGRAFO_ALVO">
             <p style="text-align: justify;"><mark style="background-color: rgba(245, 158, 11, 0.2); color: #d97706; padding: 2px 4px; border-radius: 4px; font-weight: 600;">Novo parágrafo redigido com rigor forense...</mark></p>
           </insert_after>
         - Para INSERIR um novo parágrafo ANTES / ACIMA de um parágrafo:
           <insert_before id="ID_DO_PARÁGRAFO_ALVO">
             <p style="text-align: justify;"><mark style="background-color: rgba(245, 158, 11, 0.2); color: #d97706; padding: 2px 4px; border-radius: 4px; font-weight: 600;">Novo parágrafo...</mark></p>
           </insert_before>
         - Para EXCLUIR um parágrafo:
           <delete id="ID_DO_PARÁGRAFO_A_EXCLUIR" />

      REGRAS CRÍTICAS PARA "DIFF VISUAL":
      1. Destaque o trecho novo ou modificado com a tag:
         <mark style="background-color: rgba(245, 158, 11, 0.2); color: #d97706; padding: 2px 4px; border-radius: 4px; font-weight: 600;">texto novo ou modificado</mark>

      REGRAS FORENSES GERAIS:
      1. Formate CPFs como XXX.XXX.XXX-XX, Valores como R$ X.XXX,XX e Nomes Próprios com Iniciais Maiúsculas.
      2. NUNCA use bullets (•), listas <ul> ou <li>. Para listas e pedidos, utilize alíneas com letras: a), b), c)... em parágrafos separados (<p style="text-align: justify;"><strong>a)</strong> ...</p>).
      3. NÃO use marcadores de markdown ("**"). Use a tag <strong>.
      4. NÃO inclua comentários, saudações ou blocos \`\`\`html. Apenas as tags estruturais são permitidas.
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
