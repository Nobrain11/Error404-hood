/**
 * /start command — Welcome message with inline keyboard.
 */

import { CommandContext, Context, InlineKeyboard } from "grammy";

const WEB_APP = process.env.WEB_APP_URL ?? "https://error404.xyz";

export async function startCommand(ctx: CommandContext<Context>) {
  const keyboard = new InlineKeyboard()
    .url("🌐 Open Web App",  WEB_APP)
    .url("📖 Documentation", `${WEB_APP}/docs`)
    .row()
    .url("💬 Support",       "https://t.me/Error404Support");

  await ctx.reply(
    `*Welcome to Error404 Bot* 🟢\n\n` +
    `Trade any token on *Robinhood Chain* directly from Telegram.\n\n` +
    `*Quick Start:*\n` +
    `1️⃣ Set up your wallet: \`/setkey <privateKey>\`\n` +
    `2️⃣ Check a price: \`/price <tokenAddress>\`\n` +
    `3️⃣ Buy tokens: \`/buy <tokenAddress> <amountETH>\`\n` +
    `4️⃣ Sell tokens: \`/sell <tokenAddress> <percent>\`\n\n` +
    `⚠️ *Security:* Only use burner wallets with small balances.\n\n` +
    `Type /help for the full command list.`,
    { parse_mode: "Markdown", reply_markup: keyboard }
  );
}
