import { Telegraf } from 'telegraf';

const BOT_TOKEN = process.env['TELEGRAM_BOT_TOKEN'];

let bot: Telegraf | null = null;

export function getTelegramBot(): Telegraf | null {
  if (!BOT_TOKEN) {
    return null;
  }
  
  if (!bot) {
    bot = new Telegraf(BOT_TOKEN);
  }
  
  return bot;
}

export async function notifyTelegram(
  chatId: number,
  message: string,
  parseMode: 'Markdown' | 'HTML' = 'Markdown'
): Promise<boolean> {
  const telegram = getTelegramBot();
  
  if (!telegram) {
    console.warn('Telegram bot not configured, skipping notification');
    return false;
  }

  try {
    await telegram.telegram.sendMessage(chatId, message, {
      parse_mode: parseMode,
    });
    return true;
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
    return false;
  }
}

export async function notifyResearchComplete(
  chatId: number,
  title: string,
  reportPath?: string
): Promise<boolean> {
  const message = reportPath
    ? `✅ *Research Complete!*\n\n📋 *${title}*\n\n📄 Report: \`${reportPath}\``
    : `✅ *Research Complete!*\n\n📋 *${title}*`;

  return notifyTelegram(chatId, message);
}

export async function notifyResearchFailed(
  chatId: number,
  title: string,
  error?: string
): Promise<boolean> {
  const message = error
    ? `❌ *Research Failed*\n\n📋 *${title}*\n\nError: ${error}`
    : `❌ *Research Failed*\n\n📋 *${title}*`;

  return notifyTelegram(chatId, message);
}
