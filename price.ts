/**
 * /price <tokenAddress> — Fetch live price and pool data.
 */

import { CommandContext, Context } from "grammy";
import { getTokenPrice, getVerificationStatus, BLOCKSCOUT } from "../services/pons";
import { ethers }                                            from "ethers";

export async function priceCommand(ctx: CommandContext<Context>) {
  const args = ctx.message?.text?.split(" ").slice(1) ?? [];
  const tokenAddress = args[0]?.trim();

  if (!tokenAddress || !/^0x[0-9a-fA-F]{40}$/.test(tokenAddress)) {
    return ctx.reply(
      "❌ Usage: `/price <tokenAddress>`\nExample: `/price 0xabc123...`",
      { parse_mode: "Markdown" }
    );
  }

  const loading = await ctx.reply("⏳ Fetching price…");

  try {
    // Fetch price and verification in parallel
    const [price, verified] = await Promise.all([
      getTokenPrice(tokenAddress),
      getVerificationStatus(tokenAddress),
    ]);

    // Fetch token name/symbol from Blockscout
    let name   = "Unknown";
    let symbol = "???";
    try {
      const res  = await fetch(`${BLOCKSCOUT}/tokens/${tokenAddress}`);
      const data = await res.json() as { name?: string; symbol?: string };
      name   = data.name   ?? name;
      symbol = data.symbol ?? symbol;
    } catch { /* ignore */ }

    const verifiedIcon = verified ? "✅ Verified" : "⚠️ Unverified";
    const explorerUrl  = `https://robinhoodchain.blockscout.com/address/${tokenAddress}`;
    const pairUrl      = `https://robinhoodchain.blockscout.com/address/${price.pairAddress}`;

    await ctx.api.editMessageText(
      ctx.chat.id,
      loading.message_id,
      `📊 *${name} (${symbol})*\n\n` +
      `💰 *Price:* \`${price.priceInETH.toExponential(6)}\` ETH\n` +
      `💧 *Liquidity:* \`${price.liquidityETH.toFixed(4)}\` ETH\n` +
      `🔍 *Source:* ${verifiedIcon}\n\n` +
      `📍 [Token](${explorerUrl}) | [Pair](${pairUrl})\n` +
      `\nTo trade: \`/buy ${tokenAddress} 0.01\``,
      { parse_mode: "Markdown", link_preview_options: { is_disabled: true } }
    );
  } catch (err) {
    await ctx.api.editMessageText(
      ctx.chat.id,
      loading.message_id,
      `❌ Could not fetch price.\n\nMake sure this is a valid Pons token on Robinhood Chain.\nError: ${(err as Error).message}`
    );
  }
}
