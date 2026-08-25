import { resend } from "@/lib/resend";

const FROM_EMAIL = "SmartDoc <contato@smartdoc.work>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smartdoc.work";

/**
 * 1. E-MAIL DE BOAS-VINDAS (REGISTRO DE CONTA)
 */
export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  try {
    const firstName = name ? name.split(" ")[0] : "Doutor(a)";
    const loginUrl = `${APP_URL}/login`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Bem-vindo ao SmartDoc — Seu Escritório com Inteligência Forense",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="color-scheme" content="dark light">
          <meta name="supported-color-schemes" content="dark light">
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000 !important; width: 100% !important; min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 40px 16px; background-color: #000000 !important;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #000000 !important; border: 1px solid #262626; border-radius: 16px;">
                  <tr>
                    <td style="padding: 36px 28px; background-color: #000000 !important; border-radius: 16px;">
                      
                      <!-- Logo Header -->
                      <div style="text-align: center; margin-bottom: 28px;">
                        <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.04em; color: #ffffff;">
                          SMART<span style="color: #f59e0b;">DOC</span>
                          <span style="display: inline-block; background-color: #1a1408; border: 1px solid #f59e0b; color: #f59e0b; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 9999px; vertical-align: middle; margin-left: 6px;">PRO</span>
                        </span>
                      </div>

                      <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; text-align: center; margin: 0 0 16px; letter-spacing: -0.02em;">
                        Bem-vindo ao SmartDoc, ${firstName}! ⚖️
                      </h1>

                      <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px; text-align: center; line-height: 1.6;">
                        Sua conta no <strong style="color: #ffffff;">SmartDoc</strong> foi criada com sucesso. Agora você tem em mãos a inteligência artificial desenvolvida especificamente para a prática forense de alta performance.
                      </p>

                      <!-- Recursos em Destaque -->
                      <div style="background-color: #0d0d0d !important; border: 1px solid #222222; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <h3 style="color: #f59e0b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">
                          O que você pode fazer a partir de agora:
                        </h3>
                        <ul style="margin: 0; padding-left: 18px; color: #d4d4d8; font-size: 13px; line-height: 1.8;">
                          <li><strong>Redação de Petições por Fatos:</strong> Cole o relato do cliente ou mensagens e receba uma petição estruturada em minutos.</li>
                          <li><strong>Ditado e Assistente por Voz:</strong> Ajuste pedidos e teses falando diretamente com o assistente em tempo real.</li>
                          <li><strong>Exportação Word Forense (.docx):</strong> Baixe peças diagramadas nos padrões oficiais dos tribunais brasileiros.</li>
                        </ul>
                      </div>

                      <!-- Botão de Ação -->
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${loginUrl}" style="background-color: #f59e0b; color: #000000; padding: 14px 34px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; display: inline-block;">
                          Acessar Minha Conta no SmartDoc &rarr;
                        </a>
                      </div>

                      <p style="font-size: 12px; color: #71717a; text-align: center; margin: 24px 0 0;">
                        Link direto para login: <a href="${loginUrl}" style="color: #f59e0b; text-decoration: underline;">${loginUrl}</a>
                      </p>

                      <hr style="border: none; border-top: 1px solid #222222; margin: 28px 0;" />
                      <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">
                        SmartDoc IA &bull; contato@smartdoc.work &bull; Ambiente Forense Seguro
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[RESEND] Erro ao enviar e-mail de boas-vindas:", error);
      return { success: false, error };
    }

    console.log("[RESEND] E-mail de boas-vindas enviado com sucesso para:", email);
    return { success: true, data };
  } catch (err: any) {
    console.error("[RESEND] Falha no envio de boas-vindas:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 2. E-MAIL DE RECUPERAÇÃO DE SENHA
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name: string;
  resetUrl: string;
}) {
  try {
    const firstName = name ? name.split(" ")[0] : "Doutor(a)";

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "Recuperação de Senha — SmartDoc",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="color-scheme" content="dark light">
          <meta name="supported-color-schemes" content="dark light">
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000 !important; width: 100% !important; min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 40px 16px; background-color: #000000 !important;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #000000 !important; border: 1px solid #262626; border-radius: 16px;">
                  <tr>
                    <td style="padding: 36px 28px; background-color: #000000 !important; border-radius: 16px;">
                      
                      <!-- Logo Header -->
                      <div style="text-align: center; margin-bottom: 28px;">
                        <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.04em; color: #ffffff;">
                          SMART<span style="color: #f59e0b;">DOC</span>
                        </span>
                      </div>

                      <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; text-align: center; margin: 0 0 16px; letter-spacing: -0.02em;">
                        Redefinição de Senha
                      </h1>

                      <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px; text-align: center; line-height: 1.6;">
                        Olá, <strong style="color: #ffffff;">${firstName}</strong>. Recebemos uma solicitação para redefinir a senha de acesso à sua conta no SmartDoc.
                      </p>

                      <!-- Botão de Ação -->
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetUrl}" style="background-color: #f59e0b; color: #000000; padding: 14px 34px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; display: inline-block;">
                          Criar Nova Senha &rarr;
                        </a>
                      </div>

                      <div style="background-color: #0d0d0d !important; border: 1px solid #222222; border-radius: 10px; padding: 16px; margin: 24px 0; font-size: 12px; color: #a1a1aa; line-height: 1.6;">
                        <strong style="color: #f4f4f5;">Segurança:</strong> Se você não solicitou a redefinição de senha, por favor ignore este e-mail. O link é individual e seguro.
                      </div>

                      <p style="font-size: 12px; color: #71717a; text-align: center; margin: 20px 0 0; line-height: 1.5;">
                        Se o botão não funcionar, copie e cole este link no seu navegador:<br />
                        <a href="${resetUrl}" style="color: #f59e0b; word-break: break-all;">${resetUrl}</a>
                      </p>

                      <hr style="border: none; border-top: 1px solid #222222; margin: 28px 0;" />
                      <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">
                        SmartDoc IA &bull; contato@smartdoc.work &bull; Suporte Forense
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[RESEND] Erro ao enviar e-mail de recuperação:", error);
      return { success: false, error };
    }

    console.log("[RESEND] E-mail de recuperação enviado com sucesso para:", email);
    return { success: true, data };
  } catch (err: any) {
    console.error("[RESEND] Falha no envio de recuperação:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 3. E-MAIL DE CONFIRMAÇÃO DE PAGAMENTO / RECARGA DE CRÉDITOS
 */
export async function sendPaymentSuccessEmail({
  email,
  name,
  planName,
  amountCents,
  externalId,
}: {
  email: string;
  name: string;
  planName: string;
  amountCents: number;
  externalId?: string;
}) {
  try {
    const firstName = name ? name.split(" ")[0] : "Doutor(a)";
    const dashboardUrl = `${APP_URL}/dashboard`;
    const formattedAmount = (amountCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      cc: ["felipedutra@outlook.com"],
      subject: `Créditos Adicionados: ${planName} — SmartDoc`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="color-scheme" content="dark light">
          <meta name="supported-color-schemes" content="dark light">
        </head>
        <body style="margin: 0; padding: 0; background-color: #000000 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #000000 !important; width: 100% !important; min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 40px 16px; background-color: #000000 !important;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #000000 !important; border: 1px solid #262626; border-radius: 16px;">
                  <tr>
                    <td style="padding: 36px 28px; background-color: #000000 !important; border-radius: 16px;">
                      
                      <!-- Logo Header -->
                      <div style="text-align: center; margin-bottom: 28px;">
                        <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.04em; color: #ffffff;">
                          SMART<span style="color: #f59e0b;">DOC</span>
                        </span>
                      </div>

                      <!-- Header de Sucesso -->
                      <div style="text-align: center; margin-bottom: 24px;">
                        <div style="display: inline-block; background-color: #1a1408; border: 1px solid #f59e0b; border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 24px; margin-bottom: 12px;">
                          ⚡
                        </div>
                        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">
                          Créditos Adicionados com Sucesso!
                        </h1>
                        <p style="color: #f59e0b; font-weight: 700; font-size: 14px; margin-top: 4px;">
                          Seu ${planName} já está disponível na sua conta
                        </p>
                      </div>

                      <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px; line-height: 1.6;">
                        Olá, <strong style="color: #ffffff;">${firstName}</strong>. Confirmamos o recebimento do seu Pix. Seus novos créditos de petição foram adicionados ao seu saldo e <strong>não possuem prazo de expiração</strong>.
                      </p>

                      <!-- Resumo da Transação -->
                      <div style="background-color: #0d0d0d !important; border: 1px solid #222222; border-radius: 12px; padding: 20px; margin: 24px 0;">
                        <h3 style="color: #f59e0b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 14px; border-bottom: 1px solid #222222; padding-bottom: 8px;">
                          Detalhes da Recarga
                        </h3>
                        <table style="width: 100%; font-size: 13px; color: #d4d4d8;">
                          <tr>
                            <td style="padding: 6px 0; color: #a1a1aa;">Pacote Adquirido:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #ffffff;">${planName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #a1a1aa;">Valor Pago:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #f59e0b;">${formattedAmount}</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #a1a1aa;">Forma de Pagamento:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff;">Pix Instantâneo</td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0; color: #a1a1aa;">Validade dos Créditos:</td>
                            <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #f59e0b;">Sem Expiração (Cumulativo)</td>
                          </tr>
                          ${externalId ? `
                          <tr>
                            <td style="padding: 6px 0; color: #a1a1aa;">Identificador:</td>
                            <td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 11px; color: #71717a;">${externalId}</td>
                          </tr>
                          ` : ''}
                        </table>
                      </div>

                      <!-- Botão de Ação -->
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${dashboardUrl}" style="background-color: #f59e0b; color: #000000; padding: 14px 34px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; display: inline-block;">
                          Acessar Meu Painel Agora &rarr;
                        </a>
                      </div>

                      <hr style="border: none; border-top: 1px solid #222222; margin: 28px 0;" />
                      <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">
                        SmartDoc IA &bull; contato@smartdoc.work &bull; Agradecemos a confiança!
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("[RESEND] Erro ao enviar confirmação de pagamento:", error);
      return { success: false, error };
    }

    console.log("[RESEND] Confirmação de pagamento enviada com sucesso para:", email);
    return { success: true, data };
  } catch (err: any) {
    console.error("[RESEND] Falha no envio de confirmação de pagamento:", err);
    return { success: false, error: err.message };
  }
}
