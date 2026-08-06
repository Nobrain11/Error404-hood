/**
 * bot.ts — grammY bot setup.
 * Registers all command handlers and error handling middleware.
 */

import { Bot, GrammyError, HttpError } from "grammy";
import { startCommand }  from "./commands/start";
import { helpCommand }   from "./commands/help";
import { priceCommand }  from "./commands/price";
import { buyCommand }    from "./commands/buy";
import { sellCommand }   from "./commands/sell";
import { setkeyCommand } from "./commands/setkey";
import { mykeyCommand }  from "./commands/mykey";

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set in .env");
}

export const bot = new Bot(process.env.BOT_TOKEN);

// ─── Middleware: log all incoming messages (no private key content) ────────────
bot.use(async (ctx, next) => {
  const userId   = ctx.from?.id ?? "unknown";
  const msgText  = ctx.message?.text ?? "";
  // Redact /setkey commands from logs
  const safeText = msgText.startsWith("/setkey")
    ? "/setkey [REDACTED]"
    : msgText;
  console.log(`[${new Date().toISOString()}] user:${userId} → ${safeText}`);
  await next();
});

// ─── Commands ─────────────────────────────────────────────────────────────────
bot.command("start",  startCommand);
bot.command("help",   helpCommand);
bot.command("price",  priceCommand);
bot.command("buy",    buyCommand);
bot.command("sell",   sellCommand);
bot.command("setkey", setkeyCommand);
bot.command("mykey",  mykeyCommand);

// ─── Catch-all for unrecognised messages ──────────────────────────────────────
bot.on("message", async (ctx) => {
  if (ctx.message.text && !ctx.message.text.startsWith("/")) {
    await ctx.reply(
      "I only respond to commands. Type /help to see what I can do.",
    );
  }
});

// ─── Global error handler ─────────────────────────────────────────────────────
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[BOT ERROR] update:${ctx.update.update_id}`);
  if (err.error instanceof GrammyError) {
    console.error("grammY error:", err.error.description);
  } else if (err.error instanceof HttpError) {
    console.error("HTTP error:", err.error);
  } else {
    console.error("Unknown error:", err.error);
  }
});
