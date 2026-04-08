# Telegram Bot Setup Guide

Lumina can be controlled via a private Telegram bot, allowing you to manage your smart home from anywhere.

---

## 1. Create a Telegram Bot
1. Open Telegram and search for **@BotFather**.
2. Send the command `/newbot`.
3. Follow the instructions to choose a name and username for your bot.
4. Once created, **BotFather** will provide an **API Token**.

## 2. Configure Lumina
Add your API token to the `.env.local` file in the project root:

```bash
TELEGRAM_BOT_TOKEN=your_token_here
```

## 3. Find Your User ID (Security)
Lumina is private by default. To allow yourself access, you need your numeric User ID:
1. Start the Telegram integration:
   ```bash
   npm run cli -- telegram
   ```
2. In Telegram, find your new bot and send the message `/start`.
3. The bot will respond with your **numeric Telegram User ID**.
4. Copy this ID and add it to your `.env.local`:
   ```bash
   TELEGRAM_ALLOWED_USER_ID=your_id_here
   ```
   > [!TIP]
   > You can add multiple users by separating their IDs with commas: `12345,67890`.

## 4. Usage
Once configured, you can start the bot anytime using:
```bash
npm run cli -- telegram
```
Now you can send natural language commands like "turn on the bulb" directly to your bot!
