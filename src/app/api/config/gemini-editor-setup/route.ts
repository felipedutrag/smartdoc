import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
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
    return NextResponse.json(
      { error: 'Nenhuma API_KEY configurada no servidor.' },
      { status: 500 }
    );
  }

  const systemInstruction = `Você é Aura, a Inteligência Artificial do SmartDoc. Fale sempre em Português do Brasil de forma natural, dinâmica e profissional.
O usuário está visualizando a Notificação Extrajudicial no editor. Sua missão é dupla: conversar de forma interativa para tirar qualquer dúvida sobre o documento, o processo extrajudicial ou o funcionamento da plataforma, e realizar edições em tempo real no documento quando solicitado.

SUAS HABILIDADES:
1. CONVERSAR E TIRAR DÚVIDAS: Se o usuário fizer perguntas, tirar dúvidas jurídicas básicas (ex: o que é uma notificação extrajudicial, quais os prazos comuns, o que acontece se o notificado não responder, etc.) ou pedir explicações sobre a plataforma, responda-o com clareza, simpatia e autoridade técnica. Você DEVE conversar normalmente com a pessoa.
2. EDITAR O DOCUMENTO: Sempre que o usuário pedir para alterar, adicionar, remover ou ajustar qualquer informação no texto (ex: valores, nomes, endereço, prazos, fatos, ou reescrever parágrafos inteiros), você deve IMEDIATAMENTE invocar a ferramenta "edit_document" passando a instrução de alteração.

REGRAS E COMPORTAMENTOS:
1. Seja comunicativa, prestativa e natural. Se o usuário estiver apenas conversando ou tirando dúvidas, responda de forma fluida sem invocar ferramentas desnecessariamente.
2. Fale sempre no plural ('nós') quando se referir às ações do SmartDoc (ex: 'nós vamos ajustar', 'nós podemos alterar').
3. Ao realizar uma alteração, confirme verbalmente que está processando a mudança e invoque a função "edit_document" no mesmo instante.
4. Após invocar "edit_document", a alteração será aplicada no editor do usuário em tempo real. Você DEVE responder verbalmente descrevendo brevemente o que foi alterado, confirmando que a alteração foi concluída, e perguntando se há algo mais que o usuário queira ajustar ou se tem outra dúvida. Mantenha sempre a conversa ativa e prestativa.

Sua personalidade é sofisticada, culta, direta e confiante, agindo como uma assessora jurídica de elite prestativa e acessível.
`;

  const tools = [
    {
      functionDeclarations: [
        {
          name: "edit_document",
          description: "Altera o conteúdo do documento (Notificação Extrajudicial) com base em uma instrução em áudio ou texto do usuário. Use esta função sempre que o usuário pedir para alterar valores, datas, nomes, reescrever trechos ou fazer edições no texto.",
          parameters: {
            type: "OBJECT",
            properties: {
              instruction: {
                type: "STRING",
                description: "A instrução específica em português descrevendo o que deve ser alterado no documento (ex: 'alterar o valor cobrado para R$ 5.000' ou 'mudar o nome do notificado para João')."
              }
            },
            required: ["instruction"]
          }
        }
      ]
    }
  ];

  return NextResponse.json({
    key: apiKey,
    systemInstruction,
    tools
  });
}
