/**
 * index.ts — Bot entry point.
 *
 * Starts the bot using long polling (suitable for development and VPS deployment).
 * For production at scale, switch to webhook mode using bot.api.setWebhook().
 *
 * Usage:
 *   npm run dev    — run with ts-node (development)
 *   npm run build  — compile TypeScript
 *   npm start      — run compiled JavaScript (production)
 */

import "dotenv/config";
import { bot } from "./bot";

async function main() {
  console.log("╔═══════════════════════════════════╗");
  console.log("║   Error404 Telegram Bot v1.0.0    ║");
  console.log("║   Robinhood Chain (ID: 4663)      ║");
  console.log("╚═══════════════════════════════════╝");
  console.log(`RPC:      ${process.env.RPC_URL}`);
  console.log(`Factory:  ${process.env.FACTORY_ADDRESS}`);
  console.log(`Router:   ${process.env.ROUTER_ADDRESS}`);
  console.log("");

  // Register commands with Telegram (shows in the "/" menu)
  await bot.api.setMyCommands([
    { command: "start",  description: "Welcome message" },
    { command: "help",   description: "Show all commands" },
    { command: "price",  description: "Get token price — /price <address>" },
    { command: "buy",    description: "Buy tokens — /buy <address> <amountETH>" },
    { command: "sell",   description: "Sell tokens — /sell <address> <percent|max>" },
    { command: "setkey", description: "Set trading wallet (burner only!)" },
    { command: "mykey",  description: "Show stored wallet address" },
  ]);

  // Start long polling
  await bot.start({
    onStart: (info) => {
      console.log(`✅ Bot started: @${info.username}`);
      console.log("   Listening for updates via long polling…\n");
    },
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
