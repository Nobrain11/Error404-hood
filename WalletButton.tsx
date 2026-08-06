/**
 * WalletButton.tsx
 * Connect / disconnect button that also shows network status.
 */

"use client";

import { useWallet } from "./WalletContext";
import { shortAddr } from "@/lib/utils";

export default function WalletButton() {
  const { address, connecting, isCorrectChain, chainId, connect, disconnect, switchChain } =
    useWallet();

  if (!address) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        className="px-4 py-2 rounded-lg border border-brand-green text-brand-green
                   font-mono text-sm hover:bg-brand-green hover:text-brand-bg
                   transition-all duration-200 disabled:opacity-50"
      >
        {connecting ? "Connecting…" : "Connect Wallet"}
      </button>
    );
  }

  if (!isCorrectChain) {
    return (
      <button
        onClick={switchChain}
        className="px-4 py-2 rounded-lg border border-brand-amber text-brand-amber
                   font-mono text-sm hover:bg-brand-amber hover:text-brand-bg
                   transition-all duration-200 animate-pulse"
      >
        Switch to Robinhood Chain
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
      <button
        onClick={disconnect}
        title="Click to disconnect"
        className="px-4 py-2 rounded-lg border border-brand-border text-brand-text
                   font-mono text-sm hover:border-brand-red hover:text-brand-red
                   transition-all duration-200"
      >
        {shortAddr(address)}
      </button>
    </div>
  );
}
