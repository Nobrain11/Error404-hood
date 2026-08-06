/**
 * /buy <tokenAddress> <amountInETH> — Execute a buy swap.
 */

import { CommandContext, Context } from "grammy";
import { executeSwap, getTokenPrice, BLOCKSCOUT } from "../services/pons";
import { getKey2, hasKey }                         from "../services/auth";
import { ethers }                                  from "ethers";

export async function buyCommand(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const args = ctx.message?.text?.split(" ").slice(1) ?? [];
  const [tokenAddress, amountStr] = args;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!tokenAddress || !/^0x[0-9a-fA-F]{40}$/.test(tokenAddress)) {
    return ctx.reply(
      "❌ Usage: `/buy <tokenAddress> <amountETH>`\nExample: `/buy 0xabc... 0.05`",
      { parse_mode: "Markdown" }
    );
  }
  if (!amountStr || isNaN(Number(amountStr)) || Number(amountStr) <= 0) {
    return ctx.reply("❌ Invalid ETH amount. Example: `0.05`", { parse_mode: "Markdown" });
  }
  if (!hasKey(userId)) {
    return ctx.reply(
      "❌ No wallet set.\n\nUse `/setkey <privateKey>` first.\n⚠️ Burner wallets only!",
      { parse_mode: "Markdown" }
    );
  }

  const privateKey = getKey2(userId);
  if (!privateKey) return ctx.reply("❌ Failed to decrypt your key. Please /setkey again.");

  // ── Execute ─────────────────────────────────────────────────────────────────
  const loading = await ctx.reply(`⏳ Buying tokens with ${amountStr} ETH…`);

  try {
    // Fetch token info for the reply
    let symbol = "TOKEN";
    try {
      const res  = await fetch(`${BLOCKSCOUT}/tokens/${tokenAddress}`);
      const data = await res.json() as { symbol?: string };
      symbol = data.symbol ?? symbol;
    } catch { /* ignore */ }

    // Execute the swap
    const txHash = await executeSwap("buy", tokenAddress, amountStr, privateKey, 1);
    const explorerUrl = `https://robinhoodchain.blockscout.com/tx/${txHash}`;

    await ctx.api.editMessageText(
      ctx.chat.id,
      loading.message_id,
      `✅ *Buy order submitted!*\n\n` +
      `🪙 Token: \`${tokenAddress.slice(0, 10)}…\` ($${symbol})\n` +
      `💸 Spent: \`${amountStr}\` ETH\n` +
      `⚙️ Slippage: 1%\n\n` +
      `🔗 [View Transaction](${explorerUrl})`,
      { parse_mode: "Markdown", link_preview_options: { is_disabled: true } }
    );
  } catch (err: unknown) {
    const msg = (err as { reason?: string; message?: string }).reason
             ?? (err as { message?: string }).message
             ?? "Unknown error";

    await ctx.api.editMessageText(
      ctx.chat.id,
      loading.message_id,
      `❌ *Buy failed*\n\n${msg}\n\nCheck your ETH balance and token address.`,
      { parse_mode: "Markdown" }
    );
  }
}
