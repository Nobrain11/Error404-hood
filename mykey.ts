/**
 * /mykey — Show the user's stored key in masked form + wallet address.
 */

import { CommandContext, Context } from "grammy";
import { getKey2, hasKey, maskKey } from "../services/auth";
import { ethers }                   from "ethers";

export async function mykeyCommand(ctx: CommandContext<Context>) {
  const userId = ctx.from?.id;
  if (!userId) return;

  if (!hasKey(userId)) {
    return ctx.reply(
      "❌ No wallet stored.\n\nUse `/setkey <privateKey>` to set one.\n⚠️ Burner wallets only!",
      { parse_mode: "Markdown" }
    );
  }

  const privateKey = getKey2(userId);
  if (!privateKey) {
    return ctx.reply("❌ Failed to decrypt your key. Please use `/setkey` again.", { parse_mode: "Markdown" });
  }

  const wallet = new ethers.Wallet(privateKey);

  await ctx.reply(
    `🔑 *Stored Wallet*\n\n` +
    `📍 Address: \`${wallet.address}\`\n` +
    `🔐 Key (masked): \`${maskKey(privateKey)}\`\n\n` +
    `_Key is encrypted in memory and will be cleared on bot restart._`,
    { parse_mode: "Markdown" }
  );
}
