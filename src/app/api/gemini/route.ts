import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const generateNotificationFunction: FunctionDeclaration = {
  name: "redirecionar_para_editor_e_gerar_notificacao",
  description: "Use esta função SOMENTE quando você já tiver coletado todas as informações necessárias do usuário (Quem notifica, Quem é notificado, O que aconteceu, O que está sendo exigido, Prazo). Esta função irá parar o chat e redirecionar o usuário para a tela onde a notificação será gerada profissionalmente.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      resumo_fatos: {
        type: SchemaType.STRING,
        description: "Um resumo detalhado de todos os fatos coletados na conversa para passar para o advogado robô que vai redigir o documento.",
      },
    },
    required: ["resumo_fatos"],
  },
};

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash-lite",
      tools: [{ functionDeclarations: [generateNotificationFunction] }],
      systemInstruction: `
        Você é a IA de triagem do SmartDoc.
        Seu objetivo é conversar com o usuário, tirar dúvidas e coletar os fatos para uma Notificação Extrajudicial.
        Seja educado e prestativo.
        
        Você PRECISA descobrir:
        1. Quem está enviando?
        2. Para quem está enviando?
        3. Qual é o problema/fato?
        4. Qual é a exigência e o prazo?

        ASSIM QUE VOCÊ TIVER ESSAS INFORMAÇÕES, VOCÊ DEVE OBRIGATORIAMENTE CHAMAR A FUNÇÃO 'redirecionar_para_editor_e_gerar_notificacao'. Não gere o texto da notificação no chat, apenas colete os dados e chame a função.
      `,
    });

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const call = result.response.functionCalls()?.[0];

    if (call && call.name === "redirecionar_para_editor_e_gerar_notificacao") {
      const args = call.args as { resumo_fatos: string };
      // Retorna uma resposta estruturada avisando o frontend para redirecionar
      return NextResponse.json({ 
        isFunctionCall: true, 
        action: "redirect_to_editor",
        data: args.resumo_fatos
      });
    }

    // Se não for function call, retorna o texto normalmente (vamos simular stream no frontend para simplificar a lógica combinada)
    return NextResponse.json({ 
      isFunctionCall: false, 
      text: result.response.text() 
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: "Erro ao processar sua solicitação." }, { status: 500 });
  }
}
