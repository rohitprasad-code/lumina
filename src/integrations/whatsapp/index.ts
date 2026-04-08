import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { handleMessage } from '../router';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as P from 'pino';
import qrcode from 'qrcode-terminal';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Session credentials are persisted here so you only scan the QR code once.
 * This folder is gitignored via config/*
 */
const AUTH_FOLDER = resolve(process.cwd(), 'config/whatsapp_auth');

/**
 * Optional allowlist: comma-separated WhatsApp JIDs.
 * Example: "919876543210@s.whatsapp.net"
 * Leave WHATSAPP_ALLOWED_JIDS empty to allow any sender.
 */
const allowedJids = process.env.WHATSAPP_ALLOWED_JIDS
  ? process.env.WHATSAPP_ALLOWED_JIDS.split(',').map((j) => j.trim()).filter(Boolean)
  : [];

/** Reconnect delay in ms — doubles with each failure, capped at 30s */
let reconnectDelay = 2000;

/**
 * Starts the WhatsApp bot using the Baileys library.
 *
 * On first run: a QR code prints in the terminal.
 * Open WhatsApp → Linked Devices → Link a Device → Scan QR.
 *
 * Subsequent runs: session is restored from AUTH_FOLDER automatically.
 */
export async function startWhatsAppBot(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  // Fetch the latest WA Web version dynamically so the version never goes stale
  let version: [number, number, number] = [2, 3000, 1033893291];
  try {
    const result = await fetchLatestBaileysVersion();
    version = result.version;
    console.log(`[WhatsApp] Using WA Web version: ${version.join('.')}`);
  } catch {
    console.warn('[WhatsApp] Could not fetch latest version, using fallback:', version.join('.'));
  }

  // Silent logger — keeps Baileys internals out of the console
  const logger = (P as any).default
    ? (P as any).default({ level: 'silent' })
    : (P as any)({ level: 'silent' });

  const sock = makeWASocket({
    version,
    browser: ['Lumina', 'Chrome', '120.0.0'],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
  });

  // Persist credentials whenever they update
  sock.ev.on('creds.update', saveCreds);

  // Handle connection lifecycle + QR display
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n[WhatsApp] 📱 Scan this QR code (Linked Devices → Link a Device):');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      if (isLoggedOut) {
        console.log('[WhatsApp] Logged out. Delete config/whatsapp_auth/ and restart to re-link.');
        return;
      }

      console.log(`[WhatsApp] Connection closed (code: ${statusCode}). Reconnecting in ${reconnectDelay / 1000}s…`);
      setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
        startWhatsAppBot();
      }, reconnectDelay);

    } else if (connection === 'open') {
      reconnectDelay = 2000;
      console.log('[WhatsApp] ✅ Connected and ready!');
      console.log(`[WhatsApp] sock.user = ${JSON.stringify(sock.user)}`);
      if (allowedJids.length === 0) {
        console.log('[WhatsApp] ⚠️  No allowlist configured — responding to ALL senders.');
      } else {
        console.log(`[WhatsApp] 🔒 Allowlist active — ${allowedJids.length} authorized JID(s).`);
      }
    }
  });

  /**
   * Track IDs of messages sent by the bot itself.
   * When we reply, the reply echoes back through messages.upsert with fromMe:true.
   * We add the sent message ID here so we can skip it on re-entry and avoid loops.
   */
  const sentByBot = new Set<string>();

  // Handle incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // 'notify' = real-time incoming; skip history sync bulk events
    if (type !== 'notify') return;

    for (const msg of messages) {
      const jid = msg.key.remoteJid!;
      const msgId = msg.key.id ?? '';

      // Debug: trace every event to identify where filtering blocks messages
      console.log(`[WhatsApp] [debug] event — jid=${jid} fromMe=${msg.key.fromMe} hasMsg=${!!msg.message} id=${msgId}`);

      if (!msg.message) continue; // Skip empty stubs (read receipts, etc.)

      // Skip echoes of messages the bot sent (prevents infinite reply loops)
      if (sentByBot.has(msgId)) {
        sentByBot.delete(msgId);
        console.log(`[WhatsApp] [debug] Skipping bot-sent echo id=${msgId}`);
        continue;
      }

      // Extract plain text from the most common message types
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.ephemeralMessage?.message?.conversation ||
        msg.message.ephemeralMessage?.message?.extendedTextMessage?.text ||
        '';

      if (!text.trim()) {
        console.log(`[WhatsApp] [debug] Skipping — no text content. Keys: ${Object.keys(msg.message).join(', ')}`);
        continue;
      }

      // Normalize JID to numeric part only — handles @s.whatsapp.net AND @lid formats
      const normalizeJid = (j: string) => j.split('@')[0];
      const normalizedIncoming = normalizeJid(jid);

      // Allowlist check:
      // - fromMe messages are YOUR OWN commands — always allow regardless of JID format
      // - fromMe:false messages from others are checked against the allowlist
      if (!msg.key.fromMe && allowedJids.length > 0) {
        const isAllowed = allowedJids.some(
          (allowed) => normalizeJid(allowed) === normalizedIncoming
        );
        if (!isAllowed) {
          console.warn(`[WhatsApp] 🚫 Unauthorized from ${jid}`);
          console.warn(`[WhatsApp]    Tip: add "${jid}" to WHATSAPP_ALLOWED_JIDS in .env.local`);
          continue;
        }
      }

      console.log(`[WhatsApp] 📩 From ${jid}${msg.key.fromMe ? ' [self]' : ''}: ${text}`);

      // Show "typing…" indicator while the agent is thinking
      await sock.sendPresenceUpdate('composing', jid);

      try {
        const response = await handleMessage(text);
        const sent = await sock.sendMessage(jid, { text: response });
        if (sent?.key.id) sentByBot.add(sent.key.id);
        console.log(`[WhatsApp] ✉️  Replied to ${jid}`);
      } catch (err) {
        console.error('[WhatsApp] Error handling message:', err);
        const errSent = await sock.sendMessage(jid, {
          text: '⚠️ Sorry, I encountered an error. Please try again.',
        });
        if (errSent?.key.id) sentByBot.add(errSent.key.id);
      } finally {
        await sock.sendPresenceUpdate('paused', jid);
      }
    }
  });

  console.log('--- Lumina WhatsApp Bot Starting ---');
  console.log(`[WhatsApp] Auth folder: ${AUTH_FOLDER}`);
}

// Entry point — invoked when run directly via `npm run whatsapp`
startWhatsAppBot().catch((err) => {
  console.error('[WhatsApp] Fatal startup error:', err);
  process.exit(1);
});
