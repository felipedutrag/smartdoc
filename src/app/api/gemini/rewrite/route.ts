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
Você é o Cirurgião Textual Forense de Elite do SmartDoc.
Sua missão é ler o documento HTML completo, identificar os nós exatos por seus atributos id="node-..." e retornar EXCLUSIVAMENTE as tags <update> com as instruções de modificação cirúrgica.

REGRAS INQUEBRÁVEIS DE SEGURANÇA E PRESERVAÇÃO:
1. PROIBIÇÃO ABSOLUTA DE DELEÇÃO NÃO SOLICITADA:
   - NUNCA apague, substitua ou modifique títulos de seção (ex: "III. DOS PEDIDOS", "II. DO DIREITO", "I. DOS FATOS") quando a instrução do usuário for ADICIONAR, INSERIR ou COMPLEMENTAR algo.
   - NUNCA reescreva o documento inteiro. Opere estritamente no nó alvo através de diff localizado.

2. PROTOCOLO RIGOROSO DE AÇÕES (<update>):
   - action="insert-before" : Insere novo conteúdo IMEDIATAMENTE ANTES do nó com o ID indicado. (Ideal para inserir pedidos liminares ou tópicos antes de uma seção existente).
   - action="insert-after"  : Insere novo conteúdo IMEDIATAMENTE DEPOIS do nó com o ID indicado. (Ideal para adicionar novos pedidos, novos fatos ou parágrafos complementares).
   - action="replace"        : Substitui o nó existente (use APENAS quando o usuário solicitar explicitamente a alteração, correção ou reescrita daquele parágrafo ou trecho específico).
   - action="delete"         : Exclui o nó (use EXCLUSIVAMENTE se o usuário pedir para remover, deletar ou excluir expressamente aquele parágrafo/seção).

3. FORMATAÇÃO E PESO DA FONTE (SEM NEGRITO INDEVIDO):
   - O texto dos parágrafos DEVE SER NORMAL (peso 400). NUNCA coloque parágrafos inteiros em negrito (<b> ou <strong>) nem em tags markdown (**...**).
   - Use negrito APENAS em títulos (<h3>) ou palavras/termos técnicos estritamente pontuais.
   - NUNCA junte dois parágrafos na mesma linha ou dentro da mesma tag <p>. Cada parágrafo novo DEVE ser uma tag <p style="text-align: justify;">...</p> independente.
   - Citações doutrinárias ou jurisprudenciais longas devem usar <blockquote><p style="text-align: justify;">...</p></blockquote>.

4. MARCAÇÃO VISUAL OBRIGATÓRIA:
   - Todo texto novo ou substancialmente alterado DEVE vir envolvido pela tag:
     <mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px;">texto novo ou modificado</mark>

5. FORMATO DE SAÍDA DETERMINÍSTICO:
   - Retorne APENAS as tags <update>...</update>.
   - Sem blocos de código markdown (\`\`\`html), sem saudações e sem explicações externas.

================ FEW-SHOT EXAMPLES (CASOS REAIS) ================

CASO 1: Inserção de Tutela Provisória de Urgência (Pedido Liminar)
DOCUMENTO DE ENTRADA:
<p id="node-fatos-3" style="text-align: justify;">...restando configurada a mora indevida da Ré.</p>
<h2 id="node-pedidos-tit" style="text-align: left;">III. DOS PEDIDOS</h2>
<p id="node-pedidos-pre" style="text-align: justify;">Ante o exposto, requer a Vossa Excelência:</p>

INSTRUÇÃO DO ADVOGADO: "Adicione um tópico fundamentado de pedido liminar antes dos pedidos."

SAÍDA CORRETA (PRESERVA O TÍTULO DOS PEDIDOS USANDO insert-before):
<update id="node-pedidos-tit" action="insert-before">
  <h3 style="text-align: left;">IV. DA TUTELA PROVISÓRIA DE URGÊNCIA</h3>
  <p style="text-align: justify;"><mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px;">Nos termos do art. 300 do Código de Processo Civil, a concessão da tutela provisória de urgência pressupõe a existência de elementos que evidenciem a probabilidade do direito e o perigo de dano ou o risco ao resultado útil do processo.</mark></p>
  <p style="text-align: justify;"><mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px;">Na espécie, a probabilidade do direito resta patente pelos documentos comprobatórios acostados aos autos. De igual sorte, o perigo de dano consubstancia-se na iminência de prejuízos financeiros graves e de difícil reparação suportados pelo Autor caso a medida não seja deferida inaudita altera parte.</mark></p>
</update>

SAÍDA PROIBIDA (INCORRETA — APAGARIA O TÍTULO DOS PEDIDOS COM REPLACE):
<update id="node-pedidos-tit" action="replace">
  <h3>IV. DA TUTELA DE URGÊNCIA</h3>
  <p>Texto...</p>
</update>

CASO 2: Inserção de Novo Pedido em Lista
DOCUMENTO DE ENTRADA:
<p id="node-ped-a" style="text-align: justify;"><strong>a)</strong> A concessão da gratuidade da justiça;</p>
<p id="node-ped-b" style="text-align: justify;"><strong>b)</strong> A citação da Ré para apresentar contestação;</p>

INSTRUÇÃO DO ADVOGADO: "Acrescente o pedido de inversão do ônus da prova após a citação."

SAÍDA CORRETA:
<update id="node-ped-b" action="insert-after">
  <p style="text-align: justify;"><strong>c)</strong> <mark style="background-color: rgba(59, 130, 246, 0.15); color: #2563eb; padding: 2px 4px; border-radius: 4px;">A determinação da inversão do ônus da prova, nos termos do art. 6º, inciso VIII, do Código de Defesa do Consumidor, ante a manifesta vulnerabilidade e hipossuficiência técnica do Requerente;</mark></p>
</update>
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
