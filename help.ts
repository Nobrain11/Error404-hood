/**
 * /help command — Full command reference.
 */

import { CommandContext, Context } from "grammy";

export async function helpCommand(ctx: CommandContext<Context>) {
  await ctx.reply(
    `*Error404 Bot — Commands*\n\n` +
    `\`/start\` — Welcome message\n` +
    `\`/help\` — This list\n\n` +
    `*Market Data*\n` +
    `\`/price <tokenAddress>\` — Live price, liquidity, verification status\n\n` +
    `*Trading* (requires /setkey)\n` +
    `\`/buy <tokenAddress> <amountETH>\` — Buy tokens with ETH\n` +
    `\`/sell <tokenAddress> <percent|max>\` — Sell % of balance\n\n` +
    `*Wallet*\n` +
    `\`/setkey <privateKey>\` — Store trading wallet (⚠️ burner only)\n` +
    `\`/mykey\` — Show masked stored key\n\n` +
    `*Notes:*\n` +
    `• All swaps use Pons (UniswapV2) pools on Robinhood Chain\n` +
    `• Default slippage: 1% for buys, 1% for sells\n` +
    `• Keys are encrypted in memory — never stored on disk\n` +
    `• View tx on: https://robinhoodchain.blockscout.com`,
    { parse_mode: "Markdown" }
  );
}
