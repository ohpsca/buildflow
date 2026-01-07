import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { isXPostUrl, extractUrls } from '@build-learn/shared';

interface HistorySession {
  title: string;
  status: string;
  createdAt: string;
}

interface HistoryResponse {
  sessions: HistorySession[];
}

interface ResearchResponse {
  success: boolean;
  requestId: string;
  sessionId: string;
  title: string;
}

const BOT_TOKEN = process.env['TELEGRAM_BOT_TOKEN'];
const BACKEND_URL = process.env['BACKEND_URL'] || 'http://localhost:3456';

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN environment variable is required');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.command('start', (ctx) => {
  ctx.reply(
    `*Build & Learn Bot*\n\n` +
    `Send me:\n` +
    `- Any URL to research and implement\n` +
    `- An X/Twitter post URL to analyze\n` +
    `- Text with links from X posts\n\n` +
    `I'll send it to OpenCode for processing!`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('status', async (ctx) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    if (response.ok) {
      ctx.reply('Backend is running');
    } else {
      ctx.reply('Backend returned an error');
    }
  } catch {
    ctx.reply('Cannot connect to backend');
  }
});

bot.command('history', async (ctx) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/learn?limit=5`);
    if (!response.ok) {
      ctx.reply('Failed to fetch history');
      return;
    }
    
    const data = await response.json() as HistoryResponse;
    
    if (!data.sessions || data.sessions.length === 0) {
      ctx.reply('No research history yet');
      return;
    }
    
    const historyText = data.sessions
      .map((s, i) => 
        `${i + 1}. *${s.title}*\n   Status: ${s.status}\n   ${new Date(s.createdAt).toLocaleDateString()}`
      )
      .join('\n\n');
    
    ctx.reply(`*Recent Research*\n\n${historyText}`, { parse_mode: 'Markdown' });
  } catch {
    ctx.reply('Cannot connect to backend');
  }
});

bot.on(message('text'), async (ctx) => {
  const text = ctx.message.text;
  
  if (text.startsWith('/')) {
    return;
  }

  const urls = extractUrls(text);
  
  if (urls.length === 0) {
    ctx.reply(
      'No URL found in your message.\n\n' +
      'Please send:\n' +
      '- A URL to research\n' +
      '- An X/Twitter post URL\n' +
      '- Text containing links'
    );
    return;
  }

  const hasXPost = urls.some(isXPostUrl);
  const requestType = hasXPost ? 'x_post' : 'url';
  
  const statusMsg = await ctx.reply('Sending to OpenCode...');

  try {
    const response = await fetch(`${BACKEND_URL}/api/learn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: requestType,
        source: 'telegram',
        url: hasXPost ? undefined : urls[0],
        text: hasXPost ? text : undefined,
        containedUrls: urls,
        telegramChatId: ctx.chat.id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json() as ResearchResponse;

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      undefined,
      `*Research started!*\n\n` +
      `Title: ${result.title}\n` +
      `Session: \`${result.sessionId}\`\n\n` +
      `I'll notify you when it's complete.`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    let userMessage = 'Failed to start research';
    if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED')) {
      userMessage = 'Cannot connect to backend.\nMake sure the server is running on localhost:3456';
    } else {
      userMessage = `Error: ${errorMessage}`;
    }

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      undefined,
      userMessage
    );
  }
});

bot.launch().then(() => {
  console.log('Build & Learn Telegram bot started');
  console.log(`Backend URL: ${BACKEND_URL}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
