import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";
import { getWordBuffer } from "@/utils/docx";
import { sendTelegramNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const { email, name, amount, hasOrderBump, upsellLawyer, upsellWhatsapp, phone, facts, draft } = await req.json();
    console.log(`[EMAIL_API] Tentando enviar e-mail para: ${email}, Nome: ${name}, Valor: ${amount}, Bump: ${hasOrderBump}`);

    if (!email) {
      console.error("[EMAIL_API] Erro: Email não fornecido");
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    const subjectText = hasOrderBump 
      ? "[URGENTE] Seu pagamento foi confirmado! (Notificação e Serviços Adicionais)" 
      : "Sua Notificação Extrajudicial está em anexo!";

    const attachments = [];
    if (draft) {
      try {
        const fileBuffer = await getWordBuffer("Notificacao_Extrajudicial", draft);
        const docxBuffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer as any);
        attachments.push({
          content: docxBuffer,
          filename: "notificacao-extrajudicial.docx",
        });
      } catch (err) {
        console.error("[EMAIL_API] Erro ao gerar anexo notificacao-extrajudicial.docx:", err);
      }
    }

    const { data, error } = await resend.emails.send({
      from: "smartdoc <notificacao@smartdoc.work>",
      to: [email],
      cc: ["felipedutra@outlook.com"],
      subject: subjectText,
      html: `
        <div style="background-color: #000000; padding: 40px 20px; font-family: sans-serif;">
          <div style="background-color: #050507; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 32px; max-width: 540px; margin: 0 auto; color: #d4d4d8; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 24px; color: #ffffff; position: relative;">
                <span style="font-weight: 400; letter-spacing: -0.05em;">SMART</span><span style="font-weight: 900; color: #d97706; letter-spacing: -0.05em; margin-left: 2px;">DOC</span>
                <span style="position: absolute; top: -5px; right: -22px; background: rgba(217, 119, 6, 0.12); border: 1px solid rgba(217, 119, 6, 0.25); color: #d97706; font-size: 9px; font-weight: 900; padding: 1px 3px; border-radius: 3px; text-transform: uppercase;">IA</span>
              </span>
            </div>
            
            <h1 style="color: #10b981; font-size: 22px; margin-top: 0; font-weight: 800; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 12px; text-align: center;">Pagamento Confirmado! ✅</h1>
            
            <p style="margin-top: 24px;">Olá, <strong style="color: #ffffff;">${name || 'Cliente'}</strong>,</p>
            <p>Seu pagamento no valor de <strong style="color: #ffffff;">R$ ${amount.toFixed(2).replace('.', ',')}</strong> foi processado com sucesso.</p>
            
            ${hasOrderBump ? '<p style="color: #f59e0b; font-weight: bold; background: rgba(245, 158, 11, 0.08); border-left: 3px solid #d97706; padding: 10px 14px; border-radius: 4px;">Recebemos também a sua solicitação de serviços adicionais (Order Bump). Nossa equipe entrará em contato em breve!</p>' : ''}
            
            <p>A sua <strong style="color: #ffffff;">Notificação Extrajudicial</strong> já está em anexo neste e-mail (em formato Word) pronta para uso.</p>
            
            <div style="margin: 32px 0; text-align: center;">
              <a href="https://smartdoc.work/" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);">Criar Outra Notificação</a>
            </div>
            
            <p style="font-size: 13px; color: #8e8e93; margin-top: 24px;">Se você tiver qualquer dúvida, basta responder a este e-mail.</p>
            <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 24px 0;" />
            <p style="font-size: 12px; color: #8e8e93; text-align: center; margin-bottom: 0;">Equipe SmartDoc IA</p>
          </div>
        </div>
      `,
      attachments,
    });

    if (error) {
      console.error("[EMAIL_API] Erro do Resend:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    console.log("[EMAIL_API] E-mail enviado com sucesso via Resend:", data);

    // Notificar o administrador via Telegram
    const formattedAmount = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    sendTelegramNotification(
      `#SISTEMA_ORDEM 🎉 <b>VENDA CONFIRMADA!</b>\n\n` +
      `💵 Valor: <b>${formattedAmount}</b>\n` +
      `👤 Cliente: <b>${name || 'Cliente'}</b> (${email})\n` +
      `📱 WhatsApp: <b>${phone || 'Não informado'}</b>\n` +
      `💼 Advogado Upsell: <b>${upsellLawyer ? "SIM" : "NÃO"}</b>\n` +
      `💬 WhatsApp Upsell: <b>${upsellWhatsapp ? "SIM" : "NÃO"}</b>\n` +
      `🚀 O império está crescendo!`
    ).catch(console.error);

    // Envia e-mail de alerta para o administrador com os dados do cliente e rascunho
    const adminSubject = `[NOVO PEDIDO SMARTDOC] ${name || 'Cliente'} - Pago: R$ ${amount.toFixed(2).replace('.', ',')}`;
    const { error: adminError } = await resend.emails.send({
      from: "smartdoc <notificacao@smartdoc.work>",
      to: ["felipedutra@outlook.com"],
      subject: adminSubject,
      html: `
        <div style="background-color: #000000; padding: 40px 20px; font-family: sans-serif;">
          <div style="background-color: #050507; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 32px; max-width: 540px; margin: 0 auto; color: #d4d4d8; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 28px;">
              <span style="font-size: 24px; color: #ffffff; position: relative;">
                <span style="font-weight: 400; letter-spacing: -0.05em;">SMART</span><span style="font-weight: 900; color: #d97706; letter-spacing: -0.05em; margin-left: 2px;">DOC</span>
                <span style="position: absolute; top: -5px; right: -22px; background: rgba(217, 119, 6, 0.12); border: 1px solid rgba(217, 119, 6, 0.25); color: #d97706; font-size: 9px; font-weight: 900; padding: 1px 3px; border-radius: 3px; text-transform: uppercase;">IA</span>
              </span>
            </div>
            
            <h2 style="color: #3b82f6; font-size: 20px; margin-top: 0; font-weight: 800; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 12px; text-align: center;">Novo Pedido Confirmado 🚀</h2>
            
            <h3 style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 8px; margin-top: 24px; color: #ffffff; font-size: 15px;">Dados do Cliente</h3>
            <p><strong>Nome:</strong> <span style="color: #ffffff;">${name || 'Não informado'}</span></p>
            <p><strong>E-mail:</strong> <span style="color: #ffffff;">${email}</span></p>
            <p><strong>WhatsApp:</strong> <span style="color: #ffffff;">${phone || 'Não informado'}</span></p>
            <p><strong>Valor Total Pago:</strong> <span style="color: #10b981; font-weight: bold;">R$ ${amount.toFixed(2).replace('.', ',')}</span></p>
            
            <h3 style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 8px; margin-top: 24px; color: #ffffff; font-size: 15px;">Serviços Solicitados</h3>
            <ul style="padding-left: 20px; margin: 8px 0;">
              <li><strong>Assinatura de Advogado Parceiro:</strong> ${upsellLawyer ? "<span style='color: #10b981;'>SIM ✅</span>" : "<span style='color: #ef4444;'>NÃO ❌</span>"}</li>
              <li><strong>Envio por WhatsApp e Acompanhamento:</strong> ${upsellWhatsapp ? "<span style='color: #10b981;'>SIM ✅</span>" : "<span style='color: #ef4444;'>NÃO ❌</span>"}</li>
            </ul>

            ${facts ? `
              <h3 style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 8px; margin-top: 24px; color: #ffffff; font-size: 15px;">Fatos Narrados pelo Cliente</h3>
              <div style="background-color: #121214; border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 8px; font-size: 13px; color: #e5e5e5; white-space: pre-wrap; font-family: monospace; margin-top: 10px;">${facts}</div>
            ` : ''}

            ${draft ? `
              <h3 style="border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 8px; margin-top: 24px; color: #ffffff; font-size: 15px;">Rascunho da Notificação</h3>
              <div style="background-color: #121214; border: 1px solid rgba(255, 255, 255, 0.08); padding: 14px; border-radius: 8px; font-size: 13px; color: #e5e5e5; font-family: monospace; max-height: 450px; overflow-y: auto; margin-top: 10px;">
                ${draft}
              </div>
            ` : ''}
          </div>
        </div>
      `,
      attachments,
    });

    if (adminError) {
      console.error("[EMAIL_API] Erro ao enviar e-mail de alerta para o administrador:", adminError);
    } else {
      console.log("[EMAIL_API] E-mail de alerta enviado para o administrador com sucesso.");
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[EMAIL_API] Erro catastrófico na API de e-mail:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
