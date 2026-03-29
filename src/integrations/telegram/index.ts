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

/**
 * Starts the Telegram bot listener
 */
export async function startTelegramBot() {
  if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN is not set in .env.local');
    process.exit(1);
  }

  const bot = new Telegraf(token);

  bot.on('text', async (ctx) => {
    const input = ctx.message.text;
    console.log(`[Telegram] Message from ${ctx.from.username || ctx.from.id}: ${input}`);

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
