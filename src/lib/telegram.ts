/**
 * Telegram Notification & Alert Service
 * Envia notificações e alertas formatados para o Telegram usando fetch puro.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Unificado: usa TELEGRAM_ADMIN_CHAT_ID como destino único (tanto notificações quanto alertas)
const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

/**
 * Envia uma notificação formatada em HTML para o canal/grupo principal.
 */
export async function sendTelegramNotification(message: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn("[Telegram] BOT_TOKEN ou TELEGRAM_ADMIN_CHAT_ID não configurados. Notificação não enviada.");
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[Telegram] Falha ao enviar notificação:", errText);
    }
  } catch (err) {
    console.error("[Telegram] Erro de rede ao notificar Telegram:", err);
  }
}

/**
 * Envia um alerta formatado em Markdown para o administrador.
 */
export async function sendTelegramAlert(message: string): Promise<void> {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.warn("[TelegramAlert] BOT_TOKEN ou TELEGRAM_ADMIN_CHAT_ID não configurados. Alerta não enviado.");
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[TelegramAlert] Falha ao enviar alerta:", errText);
    }
  } catch (err) {
    console.error("[TelegramAlert] Erro de rede ao enviar alerta:", err);
  }
}
