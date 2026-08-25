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
        <div style="background-color: #09090b; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; line-height: 1.6;">
          <div style="background-color: #121214; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 36px 28px; max-width: 560px; margin: 0 auto;">
            
            <!-- Logo Header -->
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.04em; color: #ffffff;">
                SMART<span style="color: #10b981;">DOC</span>
                <span style="display: inline-block; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; vertical-align: middle; margin-left: 6px;">PRO</span>
              </span>
            </div>

            <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; text-align: center; margin: 0 0 16px; letter-spacing: -0.02em;">
              Bem-vindo ao Futuro da Advocacia, ${firstName}! ⚖️
            </h1>

            <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px; text-align: center;">
              Sua conta no <strong style="color: #ffffff;">SmartDoc</strong> foi criada com sucesso. Agora você tem em mãos uma inteligência artificial desenvolvida especificamente para a prática forense de alto nível.
            </p>

            <!-- Recursos em Destaque -->
            <div style="background-color: #18181b; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #10b981; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">
                O que você pode fazer a partir de agora:
              </h3>
              <ul style="margin: 0; padding-left: 18px; color: #d4d4d8; font-size: 13px; line-height: 1.8;">
                <li><strong>Redação de Petições por Fatos:</strong> Cole o relato do cliente ou mensagens e receba uma petição completa.</li>
                <li><strong>Ditado e Assistente por Voz:</strong> Ajuste pedidos e teses falando diretamente com o assistente.</li>
                <li><strong>Exportação Word Forense (.docx):</strong> Baixe peças diagramadas nos padrões dos tribunais.</li>
              </ul>
            </div>

            <!-- Botão de Ação -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" style="background-color: #10b981; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);">
                Acessar Minha Conta no SmartDoc &rarr;
              </a>
            </div>

            <p style="font-size: 12px; color: #71717a; text-align: center; margin: 24px 0 0;">
              Link direto para login: <a href="${loginUrl}" style="color: #10b981; text-decoration: underline;">${loginUrl}</a>
            </p>

            <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 28px 0;" />
            <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">
              SmartDoc IA &bull; contato@smartdoc.work &bull; Ambiente Forense Seguro
            </p>
          </div>
        </div>
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
        <div style="background-color: #09090b; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; line-height: 1.6;">
          <div style="background-color: #121214; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 36px 28px; max-width: 560px; margin: 0 auto;">
            
            <!-- Logo Header -->
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.04em; color: #ffffff;">
                SMART<span style="color: #10b981;">DOC</span>
              </span>
            </div>

            <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; text-align: center; margin: 0 0 16px; letter-spacing: -0.02em;">
              Redefinição de Senha
            </h1>

            <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 24px; text-align: center;">
              Olá, <strong style="color: #ffffff;">${firstName}</strong>. Recebemos uma solicitação para redefinir a senha de acesso à sua conta.
            </p>

            <!-- Botão de Ação -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background-color: #10b981; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);">
                Criar Nova Senha &rarr;
              </a>
            </div>

            <div style="background-color: #18181b; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 16px; margin: 24px 0; font-size: 12px; color: #a1a1aa;">
              <strong style="color: #f4f4f5;">Segurança:</strong> Se você não solicitou a redefinição de senha, por favor ignore este e-mail. O link é seguro e expira automaticamente.
            </div>

            <p style="font-size: 12px; color: #71717a; text-align: center; margin: 20px 0 0;">
              Se o botão não funcionar, copie e cole este link no seu navegador:<br />
              <a href="${resetUrl}" style="color: #10b981; word-break: break-all;">${resetUrl}</a>
            </p>

            <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 28px 0;" />
            <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">
              SmartDoc IA &bull; contato@smartdoc.work &bull; Suporte Jurídico
            </p>
          </div>
        </div>
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
 * 3. E-MAIL DE CONFIRMAÇÃO DE PAGAMENTO / ASSINATURA
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
      subject: `Assinatura Confirmada: Plano ${planName} — SmartDoc`,
      html: `
        <div style="background-color: #09090b; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5; line-height: 1.6;">
          <div style="background-color: #121214; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 36px 28px; max-width: 560px; margin: 0 auto;">
            
            <!-- Logo Header -->
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.04em; color: #ffffff;">
                SMART<span style="color: #10b981;">DOC</span>
              </span>
            </div>

            <!-- Header de Sucesso -->
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 50%; width: 56px; height: 56px; line-height: 56px; font-size: 28px; margin-bottom: 12px;">
                ✅
              </div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">
                Pagamento Confirmado!
              </h1>
              <p style="color: #10b981; font-weight: 700; font-size: 14px; margin-top: 4px;">
                Seu plano ${planName} já está 100% ativo
              </p>
            </div>

            <p style="color: #a1a1aa; font-size: 14px; margin-bottom: 20px;">
              Olá, <strong style="color: #ffffff;">${firstName}</strong>. Confirmamos o recebimento do seu pagamento Pix. Seu acesso premium já foi liberado sem restrições.
            </p>

            <!-- Resumo da Transação -->
            <div style="background-color: #18181b; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h3 style="color: #ffffff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); padding-bottom: 8px;">
                Detalhes da Assinatura
              </h3>
              <table style="width: 100%; font-size: 13px; color: #d4d4d8;">
                <tr>
                  <td style="padding: 6px 0; color: #a1a1aa;">Plano Contratado:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #ffffff;">${planName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #a1a1aa;">Valor Pago:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #10b981;">${formattedAmount}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #a1a1aa;">Forma de Pagamento:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #ffffff;">Pix Instantâneo</td>
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
              <a href="${dashboardUrl}" style="background-color: #10b981; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);">
                Acessar Meu Painel Agora &rarr;
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 28px 0;" />
            <p style="font-size: 11px; color: #52525b; text-align: center; margin: 0;">
              SmartDoc IA &bull; contato@smartdoc.work &bull; Agradecemos a confiança!
            </p>
          </div>
        </div>
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
