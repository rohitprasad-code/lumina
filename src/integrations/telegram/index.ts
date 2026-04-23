import { Telegraf } from 'telegraf';
import { handleMessage } from '../router';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

/**
 * Message Router
 * Routes messages from CLI, Telegram, or WhatsApp to the AI Agent.
 */

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const token = process.env.TELEGRAM_BOT_TOKEN;
const allowedUserIds = process.env.TELEGRAM_ALLOWED_USER_ID 
  ? process.env.TELEGRAM_ALLOWED_USER_ID.split(',').map(id => id.trim()) 
  : [];

/**
 * Starts the Telegram bot listener
 */
export async function startTelegramBot() {
  if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN is not set in .env.local');
    process.exit(1);
  }

  const bot = new Telegraf(token);

  // Command to help user find their ID
  bot.command('start', (ctx) => {
    ctx.reply(`Welcome to Lumina! 👋\n\nYour *numeric* Telegram User ID is: \`${ctx.from.id}\`\n\nTo restrict access, copy and paste this ID into your \`.env.local\`:\n\`TELEGRAM_ALLOWED_USER_ID=${ctx.from.id}\` (or a comma-separated list if multiple users)`, { parse_mode: 'Markdown' });
  });

  bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const input = ctx.message.text;

    // Security Check: Only allow specified user IDs if configured
    if (allowedUserIds.length > 0 && !allowedUserIds.includes(userId)) {
      console.warn(`[Security] Unauthorized access attempt from ${ctx.from.username || userId}`);
      // Silently ignore or send a short message
      return ctx.reply('⚠️ Access Denied. This bot is private.');
    }

    console.log(`[Telegram] Message from ${ctx.from.username || userId}: ${input}`);

    try {
      // Send typing status to make the bot feel responsive
      await ctx.sendChatAction('typing');

      // Process message through the router
      const response = await handleMessage(input);

      // Send the response back
      await ctx.reply(response);
    } catch (error) {
      console.error('[Telegram] Error handling message:', error);
      await ctx.reply('Sorry, I encountered an error. Please try again later.');
    }
  });

  bot.catch((err: unknown, ctx) => {
    console.error(`[Telegram] Error for ${ctx.updateType}:`, err);
  });

  console.log('--- Lumina Telegram Bot Starting ---');
  bot.launch();

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  console.log('Bot is running in long-polling mode...');
}

// Entry point — invoked when run directly
if (require.main === module || process.argv[1]?.endsWith('telegram/index.ts')) {
  startTelegramBot().catch((err) => {
    console.error('[Telegram] Fatal startup error:', err);
    process.exit(1);
  });
}
