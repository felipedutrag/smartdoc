import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_AUDIO_API_KEY,
  ].filter(Boolean) as string[];

  const apiKey = keys.length > 0 ? keys[0] : "";

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Nenhuma API_KEY configurada no servidor.' },
      { status: 500 }
    );
  }

  const systemInstruction = `Você é a IA Jurídica e Assessora Forense do SmartDoc. Fale sempre em Português do Brasil de forma natural, dinâmica e sofisticada.
Sua missão é conversar com o usuário, tirar dúvidas jurídicas e editar a Petição Inicial / Peça Jurídica que ele está visualizando, economizando tokens e sendo extremamente precisa.

SUAS HABILIDADES DE EDIÇÃO (Use as ferramentas corretas):
1. formatação rápida (format_text): Se o usuário pedir para colocar em negrito, alinhar, justificar, remover negrito ou aplicar formatação visual, USE APENAS A FERRAMENTA "format_text". Isso é imediato, gratuito e não gasta tokens reescrevendo o documento.
2. reescrita e adição de conteúdo (edit_document): Se o usuário pedir para adicionar um novo pedido, criar um parágrafo, mudar um valor, alterar o endereçamento ou modificar o texto jurídico em si, use a ferramenta "edit_document".
   - NUMERAÇÃO DE PARÁGRAFOS: O documento possui uma régua com parágrafos numerados sequencialmente ([Parágrafo 1], [Parágrafo 2], ...). O usuário pode se referir diretamente aos números, como: "adicione um parágrafo abaixo do parágrafo 10 dizendo...", "reescreva o parágrafo 4", "exclua o parágrafo 8".
   - SEJA PRECISA: Ao enviar a "instruction" para o edit_document, descreva EXATAMENTE ONDE o conteúdo deve entrar e o número do parágrafo de referência (ex: "Adicionar logo abaixo do parágrafo 10 o seguinte texto...", "Alterar o parágrafo 14 para...", "Substituir o parágrafo 2 pela qualificação completa..."). O sistema reordena e numera os parágrafos subsequentes automaticamente.

REGRAS:
1. Converse de forma fluida e profissional.
2. Seja ágil ao acionar as ferramentas.
3. Não use o edit_document para formatar texto visualmente (como negritos e alinhamentos). Use o format_text para isso.
4. Confirme verbalmente a ação que acabou de executar de forma concisa.
`;

  const tools = [
    {
      functionDeclarations: [
        {
          name: "edit_document",
          description: "Reescreve, adiciona ou altera o texto jurídico da petição. Use para criar conteúdo novo, mudar valores, teses, fatos ou nomes. NÃO USE PARA FORMATAÇÃO VISUAL.",
          parameters: {
            type: "OBJECT",
            properties: {
              instruction: {
                type: "STRING",
                description: "Instrução exata do que fazer e ONDE fazer (ex: 'Adicionar nos Pedidos a condenação em custas' ou 'Substituir o primeiro parágrafo dos Fatos por...'). Seja específico sobre a seção alvo."
              }
            },
            required: ["instruction"]
          }
        },
        {
          name: "format_text",
          description: "Aplica formatação visual da barra de ferramentas (negrito, alinhamento, etc) em um trecho de texto existente sem reescrever o documento. Economiza tokens.",
          parameters: {
            type: "OBJECT",
            properties: {
              target_text: {
                type: "STRING",
                description: "O trecho exato de texto (algumas palavras ou frase) que já existe no documento e deve receber a formatação."
              },
              action: {
                type: "STRING",
                description: "A ação de formatação a ser aplicada.",
                enum: ["bold", "unbold", "italic", "underline", "justifyCenter", "justifyRight", "justifyLeft", "justifyFull"]
              }
            },
            required: ["target_text", "action"]
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

