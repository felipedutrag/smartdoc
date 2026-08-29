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

    const modelName = "gemini-2.5-flash";
    console.log(`\n======================================================`);
    console.log(`[EDITOR / REESCRITA] 🚀 Modelo Gemini Ativo: ${modelName}`);
    console.log(`======================================================\n`);

    const knowledgeBase = await getLegalKnowledgeBase(`${instruction} ${selectedText || ""}`);

    const systemInstruction = `
Você é um Assistente Jurídico de Elite Especializado em Edição e Cirurgia Textual de Petições Forenses.
Sua missão é ler o documento HTML completo, identificar os nós exatos por seus atributos id="node-..." e retornar EXCLUSIVAMENTE as tags <update> com as instruções de modificação.

PROTOCOLO RIGOROSO DE AÇÕES (<update>):
1. INSERÇÃO DE CONTEÚDO NOVO (Adicionar tópicos, novos pedidos, argumentos, parágrafos ou jurisprudência):
   - NUNCA substitua ou apague o nó de referência se a intenção for apenas adicionar algo novo!
   - Use action="insert-after" ou action="insert-before" referenciando o id do bloco vizinho mais adequado.
   - Exemplo (inserir pedido liminar antes dos pedidos principais):
     <update id="node-id-dos-pedidos" action="insert-before">
       <h3 style="text-align: left;">IV. DA TUTELA DE URGÊNCIA (PEDIDO LIMINAR)</h3>
       <p style="text-align: justify;"><mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px;">Nos termos do art. 300 do CPC, a concessão da tutela provisória de urgência pressupõe a existência de elementos que evidenciem a probabilidade do direito e o perigo de dano ou o risco ao resultado útil do processo...</mark></p>
     </update>

2. ALTERAÇÃO / REESCRITA DE CONTEÚDO EXISTENTE:
   - Use action="replace" (ou omita a action) APENAS quando o usuário solicitar explicitamente a alteração, correção ou reescrita daquele parágrafo ou trecho específico.
   - Forneça a tag completa do bloco substituído (<p style="text-align: justify;">...</p>).

3. EXCLUSÃO DE CONTEÚDO:
   - Use action="delete" EXCLUSIVAMENTE se o usuário pedir para remover, deletar ou excluir expressamente aquele parágrafo/seção.

4. FORMATAÇÃO E PESO DA FONTE (SEM NEGRITO INDEVIDO):
   - O texto dos parágrafos DEVE SER NORMAL (peso 400). NUNCA coloque parágrafos inteiros em negrito (<b> ou <strong>) nem em tags markdown (**...**).
   - Use negrito APENAS em títulos (<h3>) ou palavras/termos técnicos estritamente pontuais se necessário.
   - NUNCA junte dois parágrafos na mesma linha ou dentro da mesma tag <p>. Cada parágrafo novo DEVE ser uma tag <p style="text-align: justify;">...</p> independente.
   - Citações doutrinárias ou jurisprudenciais devem usar <blockquote><p style="text-align: justify;">...</p></blockquote>.

5. MARCAÇÃO VISUAL:
   - Todo texto novo ou substancialmente alterado DEVE vir envolvido pela tag:
     <mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px;">texto novo ou modificado</mark>

6. FORMATO DE SAÍDA:
   - Retorne APENAS as tags <update>...</update>.
   - Sem blocos de código markdown (\`\`\`html), sem saudações e sem explicações externas.
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
