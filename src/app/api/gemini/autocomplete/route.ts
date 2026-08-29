import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prefix, suffix, facts, title } = await req.json();

    if (!prefix || typeof prefix !== "string" || prefix.trim().length < 2) {
      return NextResponse.json({ suggestion: "" });
    }

    // REGRA DE OURO 1: Se o cursor está colado imediatamente após uma pontuação final sem espaço (ex: "imóvel.|"), não deve sugerir continuação colada.
    if (
      prefix.endsWith(".") ||
      prefix.endsWith("!") ||
      prefix.endsWith("?") ||
      prefix.endsWith(";") ||
      prefix.endsWith(":")
    ) {
      return NextResponse.json({ suggestion: "" });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return NextResponse.json(
        { error: "Nenhuma API Key (GROQ_API_KEY ou GEMINI_API_KEY) configurada no servidor." },
        { status: 500 }
      );
    }

    // Extrai o parágrafo ou linha atual onde o advogado está digitando
    const lines = prefix.split("\n");
    const currentLine = lines[lines.length - 1] || "";
    const isAfterSentence = prefix.endsWith(". ") || prefix.endsWith(".\n");

    const systemInstruction = `
Você é o Assistente de Autocomplete Inline (Ghost Text) do SmartDoc para Petições Forenses.
Sua missão é estritamente completar o raciocínio sintático e jurídico do que o advogado está escrevendo AGORA, com máxima precisão e coerência contextual.

DIRETRIZES DE CONTINUAÇÃO:
1. SE A FRASE ESTIVER NO MEIO (sem ponto final):
   - Continue a gramática e a tese jurídica daquela oração exata até fechar o sentido do período.
   - NUNCA mude de assunto nem traga matérias aleatórias que não foram mencionadas na frase atual.
   - Mantenha a concordância verbal e nominal impecável com o início da frase.
   - PROIBIDO iniciar a sugestão com sinais de pontuação (vírgula, ponto, etc) a menos que a gramática EXIJA estritamente para conectar com a última palavra digitada.

2. SE FOR O INÍCIO DE UMA NOVA ORAÇÃO (após ponto final e espaço ". "):
   - Inicie a sugestão OBRIGATORIAMENTE com letra MAIÚSCULA, usando um conectivo forense clássico que faça a transição lógica para a próxima ideia (ex: "Nesse sentido,", "Outrossim,", "Ademais, cumpre registrar que", "Por conseguinte,").

3. ESTRUTURAS CANÔNICAS (Se o usuário estiver iniciando uma fórmula clássica):
   - Endereçamento ("EXCELENTÍSSIMO SENHOR") -> " DOUTOR JUIZ DE DIREITO DA ___ VARA CÍVEL DA COMARCA DE [CIDADE/ESTADO]"
   - Preâmbulo ("Felipe, brasileiro,") -> " [estado civil], [profissão], portador da cédula de identidade RG nº [Número], inscrito no CPF sob o nº [Número], residente e domiciliado na [Endereço], propor a presente"
   - Ação ("propor a presente") -> " AÇÃO DE [NOME DA AÇÃO] em face de [NOME DO RÉU], pelos fatos e fundamentos a seguir:"
   - Artigos ("artigo 186") -> " do Código Civil: aquele que, por ação ou omissão voluntária, negligência ou imprudência, violar direito e causar dano a outrem, comete ato ilícito."
   - Pedidos ("Ante o exposto, requer") -> " a Vossa Excelência a total PROCEDÊNCIA dos pedidos formulados na presente demanda para:"
   - Provas ("Protesta provar") -> " o alegado por todos os meios de prova em direito admitidos."
   - Fechamento ("Nestes termos,") -> " pede e espera deferimento."

REGRAS DE FORMATAÇÃO:
- Complete a oração ou raciocínio jurídico de forma fluida e substancial (gerando entre 8 e 35 palavras, fechando o período ou conectando à próxima cláusula com sentido completo).
- Não seja excessivamente econômico: entregue a ideia inteira com clareza forense.
- Sem markdown, sem aspas, sem explicações meta.
- Nunca repita o que já foi digitado no prefixo se não for para completar uma palavra.
- NUNCA invente pontuação prematura que quebre o meio da frase.
`;

    let prompt = `${title ? `TÍTULO DA PEÇA: ${title}\n` : ""}${facts ? `SUBSTRATO FÁTICO: ${facts.slice(0, 400)}\n` : ""}\nTEXTO ANTERIOR AO CURSOR:\n"${prefix.slice(-1200)}"\n\n${
      suffix && suffix.trim().length > 0 ? `TEXTO POSTERIOR (SUFIXO):\n"${suffix.slice(0, 150)}"\n\n` : ""
    }CONTINUAÇÃO IMEDIATA (Retorne estritamente o complemento textual seguinte):`;

    let suggestion = "";

    if (groqKey) {
      try {
        // Prioridade: GROQ (Velocidade insana com LPU)
        const groq = new Groq({ apiKey: groqKey });
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile", // Llama 3.3 70B ativo no Groq
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 120,
          stop: ["\n\n", "TEXTO ANTERIOR:", "TEXTO POSTERIOR:"],
        });

        suggestion = completion.choices[0]?.message?.content || "";
      } catch (groqError: any) {
        console.error("[GROQ ERROR - Revertendo para Gemini]:", groqError?.message || groqError);
      }
    }

    // Se Groq não retornou ou falhou, usa Gemini como Fallback
    if (!suggestion && geminiKey) {
      const modelName = "gemini-2.5-flash";
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 120,
          stopSequences: ["\n\n", "TEXTO ANTERIOR:", "TEXTO POSTERIOR:"],
        },
      });

      const result = await model.generateContent(prompt);
      suggestion = result.response?.text() || "";
    }

    // Limpezas iniciais - NÃO damos trim() logo de cara para não perder o overlap exato
    suggestion = suggestion
      .replace(/^(```[a-z]*|```)/gi, "")
      .replace(/[\r]+/g, "");

    if (!suggestion.trim()) {
      return NextResponse.json({ suggestion: "" });
    }

    let exactOverlap = false;

    // 1. Tenta achar sobreposição exata (case-insensitive) - resolve a maioria dos casos de palavras cortadas
    const minLen = Math.min(prefix.length, suggestion.length, 60);
    let overlapLength = 0;
    for (let i = minLen; i >= 1; i--) {
      const prefixEnd = prefix.slice(-i).toLowerCase();
      const sugStart = suggestion.slice(0, i).toLowerCase();
      if (prefixEnd === sugStart) {
        overlapLength = i;
        break;
      }
    }

    if (overlapLength > 0) {
      suggestion = suggestion.slice(overlapLength);
      exactOverlap = true;
    } else {
      // 2. Sobreposição por palavra (caso haja divergência de pontuação/espaço gerada pela IA)
      const trimmedPrefix = prefix.trimEnd();
      const prefixWords = trimmedPrefix.split(/[\s,]+/);
      const lastPrefixWord = prefixWords[prefixWords.length - 1]?.replace(/[^a-zA-Z0-9À-ÿ]/g, "");
      
      const suggestionWords = suggestion.split(/[\s,]+/);
      const firstSugWord = suggestionWords[0]?.replace(/[^a-zA-Z0-9À-ÿ]/g, "");

      if (lastPrefixWord && firstSugWord && lastPrefixWord.toLowerCase() === firstSugWord.toLowerCase()) {
        const match = suggestion.match(/^[^\wÀ-ÿ]*[\wÀ-ÿ]+/);
        if (match) {
          // Nesse fallback, damos um trimLeft para evitar espaços duplos
          suggestion = suggestion.slice(match[0].length).trimLeft(); 
        }
      }
    }

    // 3. Remoção de pontuação indevida gerada pela IA no início
    // Ex: usuário digitou "autor, " e IA gerou ", qualificação" -> tira a vírgula extra
    if (prefix.trimEnd().endsWith(",")) {
      suggestion = suggestion.replace(/^[\s]*,[\s]*/, prefix.endsWith(" ") ? "" : " ");
    } else if (prefix.trimEnd().endsWith(".")) {
      suggestion = suggestion.replace(/^[\s]*\.[\s]*/, prefix.endsWith(" ") ? "" : " ");
    }

    // Se a IA gerou APENAS a mesma palavra e sobrou nada, saímos fora
    if (!suggestion) {
      return NextResponse.json({ suggestion: "" });
    }

    // Se acabou de fechar uma frase com ponto e espaço (". "), garante que começa com letra maiúscula
    if (isAfterSentence && suggestion.length > 0 && /^[a-zA-ZÀ-ÿ]/.test(suggestion)) {
      suggestion = suggestion.charAt(0).toUpperCase() + suggestion.slice(1);
    }

    // 4. Lógica de espaçamento para junção impecável
    if (
      suggestion.length > 0 &&
      !prefix.endsWith(" ") &&
      !prefix.endsWith("\n") &&
      !prefix.endsWith("(") &&
      !prefix.endsWith("[") &&
      !prefix.endsWith("/") &&
      !exactOverlap // Se teve exact overlap, o corte já garante a junção perfeita letra com letra
    ) {
      // Se não começa com espaço e não começa com pontuação de fechamento, injetamos espaço
      if (
        !suggestion.startsWith(" ") &&
        !/^[.,;?!:)]/.test(suggestion)
      ) {
        suggestion = " " + suggestion;
      }
    }

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error("[AUTOCOMPLETE ERROR]:", error?.message || error);
    return NextResponse.json({ suggestion: "" });
  }
}
