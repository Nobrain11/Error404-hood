/**
 * /sell <tokenAddress> <percent|max> — Execute a sell swap.
 * Sells a percentage of the user's token balance (or full balance for "max").
 */

import { CommandContext, Context } from "grammy";
import { executeSwap, getTokenBalance, BLOCKSCOUT } from "../services/pons";
import { getKey2, hasKey }                           from "../services/auth";
import { ethers }                                    from "ethers";

export async function sellCommand(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const args    = ctx.message?.text?.split(" ").slice(1) ?? [];
  const [tokenAddress, percentStr] = args;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!tokenAddress || !/^0x[0-9a-fA-F]{40}$/.test(tokenAddress)) {
    return ctx.reply(
      "❌ Usage: `/sell <tokenAddress> <percent|max>`\n" +
      "Examples:\n" +
      "`/sell 0xabc... 50` — sell 50% of balance\n" +
      "`/sell 0xabc... max` — sell everything",
      { parse_mode: "Markdown" }
    );
  }
  if (!percentStr) {
    return ctx.reply("❌ Specify a percentage (1-100) or `max`.", { parse_mode: "Markdown" });
  }

  const isMax   = percentStr.toLowerCase() === "max";
  const percent = isMax ? 100 : Number(percentStr);

  if (!isMax && (isNaN(percent) || percent <= 0 || percent > 100)) {
    return ctx.reply("❌ Percentage must be between 1 and 100, or `max`.", { parse_mode: "Markdown" });
  }
  if (!hasKey(userId)) {
    return ctx.reply(
      "❌ No wallet set.\n\nUse `/setkey <privateKey>` first.\n⚠️ Burner wallets only!",
      { parse_mode: "Markdown" }
    );
  }

  const privateKey = getKey2(userId);
  if (!privateKey) return ctx.reply("❌ Failed to decrypt key. Please /setkey again.");

  const loading = await ctx.reply("⏳ Preparing sell order…");

  try {
    // Derive wallet address from private key to check balance
    const wallet      = new ethers.Wallet(privateKey);
    const walletAddr  = wallet.address;

    // Fetch live balance
    const balanceStr = await getTokenBalance(tokenAddress, walletAddr);
    const balance    = Number(balanceStr);

    if (balance <= 0) {
      return ctx.api.editMessageText(
        ctx.chat.id, loading.message_id,
        "❌ You have no balance of this token."
      );
    }

    // Compute sell amount
    const sellAmount = ((balance * percent) / 100).toFixed(6);

    // Fetch token symbol
    let symbol = "TOKEN";
    try {
      const res  = await fetch(`${BLOCKSCOUT}/tokens/${tokenAddress}`);
      const data = await res.json() as { symbol?: string };
      symbol = data.symbol ?? symbol;
    } catch { /* ignore */ }

    await ctx.api.editMessageText(
      ctx.chat.id, loading.message_id,
      `⏳ Selling ${sellAmount} $${symbol} (${percent}% of ${balance.toFixed(4)})…`
    );

    // Execute swap
    const txHash      = await executeSwap("sell", tokenAddress, sellAmount, privateKey, 1);
    const explorerUrl = `https://robinhoodchain.blockscout.com/tx/${txHash}`;

    await ctx.api.editMessageText(
      ctx.chat.id,
      loading.message_id,
      `✅ *Sell order submitted!*\n\n` +
      `🪙 Token: $${symbol}\n` +
      `📤 Sold: \`${sellAmount}\` tokens (${percent}%)\n` +
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
      `❌ *Sell failed*\n\n${msg}`,
      { parse_mode: "Markdown" }
    );
  }
}
