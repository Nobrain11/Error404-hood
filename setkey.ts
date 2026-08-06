/**
 * /setkey <privateKey> — Securely store the user's trading wallet private key.
 *
 * Security model:
 *  - The key is immediately encrypted with AES-256-GCM in memory.
 *  - The plaintext is never logged or stored on disk.
 *  - The original message is deleted from Telegram (best-effort) to reduce exposure.
 *  - Users are repeatedly warned to use burner wallets only.
 */

import { CommandContext, Context } from "grammy";
import { storeKey, maskKey }       from "../services/auth";
import { ethers }                  from "ethers";

export async function setkeyCommand(ctx: CommandContext<Context>) {
  const userId  = ctx.from?.id;
  const chatId  = ctx.chat?.id;
  const msgId   = ctx.message?.message_id;
  if (!userId || !chatId) return;

  const args       = ctx.message?.text?.split(" ").slice(1) ?? [];
  const privateKey = args[0]?.trim();

  // ── Immediately delete the message to minimise key exposure in Telegram ──
  if (msgId) {
    ctx.api.deleteMessage(chatId, msgId).catch(() => {
      // Ignore — bot may not have delete permissions in group chats
    });
  }

  if (!privateKey) {
    return ctx.reply(
      "❌ Usage: `/setkey <privateKey>`\n\n" +
      "⚠️ *IMPORTANT:* Only use a dedicated *burner wallet* with small amounts.\n" +
      "Your key is transmitted to this bot server — never use your main wallet.",
      { parse_mode: "Markdown" }
    );
  }

  // ── Validate private key format ──────────────────────────────────────────
  try {
    // ethers.Wallet constructor validates the key
    const wallet = new ethers.Wallet(privateKey);
    const addr   = wallet.address;

    // Store encrypted in memory
    storeKey(userId, privateKey);

    await ctx.reply(
      `✅ *Wallet set successfully*\n\n` +
      `📍 Address: \`${addr}\`\n` +
      `🔑 Key: \`${maskKey(privateKey)}\`\n\n` +
      `⚠️ *Reminder:*\n` +
      `• Key is encrypted in memory only\n` +
      `• Restarting the bot clears all stored keys\n` +
      `• *Never* use your main wallet here\n` +
      `• Error404 team will never ask for your key`,
      { parse_mode: "Markdown" }
    );
  } catch {
    await ctx.reply(
      "❌ *Invalid private key.*\n\n" +
      "Make sure it starts with `0x` and is 64 hex characters.",
      { parse_mode: "Markdown" }
    );
  }
}
