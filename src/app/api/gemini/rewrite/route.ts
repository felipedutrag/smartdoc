import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/telegram";
import { getLegalKnowledgeBase } from "@/knowledge";

export async function POST(req: Request) {
  try {
    const { text, instruction, selectedText } = await req.json();

    if (!text || !instruction) {
      return NextResponse.json({ error: "Texto ou instrução ausentes." }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return NextResponse.json({ error: "Nenhuma chave de IA configurada para reescrita." }, { status: 500 });
    }

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

    let resultStream: any;
    let isGroq = false;

    // Prioridade 1: Groq LPU (Ultra-rápido, ~500ms TTFT)
    if (groqKey) {
      try {
        console.log("[REWRITE] ⚡ Disparando edição ultra-rápida via Groq LPU (GPT-OSS 120B)...");
        const groq = new Groq({ apiKey: groqKey });
        resultStream = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 3000,
          stream: true,
        });
        isGroq = true;
      } catch (groqErr) {
        console.warn("[REWRITE] Falha na tentativa Groq, caindo para Gemini:", groqErr);
      }
    }

    // Fallback: Gemini Flash
    if (!resultStream && geminiKey) {
      console.log("[REWRITE] 🔄 Disparando edição via Gemini Flash...");
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        }
      });
      const result = await model.generateContentStream(prompt);
      resultStream = result.stream;
      isGroq = false;
    }

    if (!resultStream) {
      throw new Error("Não foi possível inicializar nenhum modelo de IA para reescrita.");
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (isGroq) {
            for await (const chunk of resultStream) {
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
          } else {
            for await (const chunk of resultStream) {
              const chunkText = chunk.text();
              if (chunkText) {
                controller.enqueue(new TextEncoder().encode(chunkText));
              }
            }
          }
          controller.close();
        } catch (e: any) {
          console.error("Stream rewrite error:", e);
          sendTelegramAlert(
            `🔴 *SmartDoc — Falha na API de Reescrita*\n\n` +
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
