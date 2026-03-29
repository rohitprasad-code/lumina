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
const allowedUserId = process.env.TELEGRAM_ALLOWED_USER_ID;

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
    ctx.reply(`Welcome to Lumina! 👋\n\nYour Telegram User ID is: \`${ctx.from.id}\`\n\nTo restrict access, add this ID to your \`.env.local\` as \`TELEGRAM_ALLOWED_USER_ID=${ctx.from.id}\``, { parse_mode: 'MarkdownV2' });
  });

  bot.on('text', async (ctx) => {
    const userId = ctx.from.id.toString();
    const input = ctx.message.text;

    // Security Check: Only allow specified user ID if configured
    if (allowedUserId && userId !== allowedUserId) {
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

  bot.catch((err: any, ctx) => {
    console.error(`[Telegram] Error for ${ctx.updateType}:`, err);
  });

  console.log('--- Lumina Telegram Bot Starting ---');
  bot.launch();

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  console.log('Bot is running in long-polling mode...');
}
