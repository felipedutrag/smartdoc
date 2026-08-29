import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";
import { getLegalKnowledgeBase } from "@/knowledge";

export async function POST(req: Request) {
  try {
    const { text, instruction, selectedText } = await req.json();

    if (!text || !instruction) {
      return NextResponse.json({ error: "Texto ou instrução ausentes." }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ error: "Chave GEMINI_API_KEY não configurada no servidor." }, { status: 500 });
    }

    const modelName = "gemini-3.1-flash-lite";
    console.log(`\n======================================================`);
    console.log(`[EDITOR / REESCRITA] 🚀 Modelo Gemini Ativo: ${modelName}`);
    console.log(`======================================================\n`);

    const knowledgeBase = await getLegalKnowledgeBase(`${instruction} ${selectedText || ""}`);

    const systemInstruction = `
Você é um Assistente Jurídico Especializado em Edição Cirúrgica de Petições Iniciais.
Sua tarefa é ler o documento HTML, localizar os nós/blocos exatos (<p>, <blockquote>, <h3>, etc.) com seus respectivos IDs (ex: id="node-12345678") e retornar EXCLUSIVAMENTE as tags <update id="ID_DO_BLOCO"> com o conteúdo modificado.

${knowledgeBase ? `
BASE DE CONHECIMENTO FORENSE E PRECEDENTES:
${knowledgeBase}
` : ""}

REGRAS RÍGIDAS DE SAÍDA:
1. Retorne APENAS as tags <update id="..."> com as alterações. NUNCA retorne o documento inteiro ou textos de introdução.
2. Mantenha o id exato do bloco alvo.
3. Para trechos modificados ou adicionados, envolva o texto novo na tag:
   <mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px; font-weight: 600;">texto alterado</mark>
4. Todo parágrafo <p> deve ter style="text-align: justify;".
5. Sem markdown extra envolvente (\`\`\`html), envie apenas as tags <update> cruas.
`;

    let prompt = `DOCUMENTO ATUAL (HTML):\n${text}\n\nINSTRUÇÃO DO USUÁRIO:\n${instruction}`;
    if (selectedText) {
      prompt += `\n\nTRECHO SELECIONADO PELO USUÁRIO (A alteração deve ser aplicada estritamente sobre ou em relação a este trecho):\n"${selectedText}"`;
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
      }
    });

    const result = await model.generateContentStream(prompt);

    if (result.response) {
      result.response.catch(() => {});
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            let chunkText = "";
            try {
              chunkText = chunk.text();
            } catch (chunkErr) {
              if (chunk.candidates?.[0]?.content?.parts) {
                chunkText = chunk.candidates[0].content.parts
                  .filter((p: any) => typeof p.text === "string")
                  .map((p: any) => p.text)
                  .join("");
              }
            }
            if (chunkText) {
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
          }
          try { controller.close(); } catch {}
        } catch (e: any) {
          console.error(`Stream rewrite error (${modelName}):`, e);
          sendTelegramAlert(
            `🔴 *SmartDoc — Falha na API de Reescrita*\n\n` +
            `*Erro:* \`${e?.message || String(e)}\`\n` +
            `*Horário:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
          ).catch(console.error);
          try { controller.error(e); } catch {}
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Rewrite API Error:", message);
    sendTelegramAlert(
      `🔴 *SmartDoc — Falha na API de Reescrita*\n\n` +
      `*Erro:* \`${message}\`\n` +
      `*Horário:* ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
    ).catch(console.error);
    return NextResponse.json({ error: "Erro ao reescrever o trecho." }, { status: 500 });
  }
}
