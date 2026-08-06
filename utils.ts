/**
 * utils.ts — Shared utility helpers for Error404 web app.
 * Pure functions only; no side effects.
 */

import { formatDistanceToNow } from "date-fns";

/** Shorten a hex address for display: 0x1234…abcd */
export function shortAddr(addr: string, chars = 4): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

/** Format a token amount with commas and fixed decimals */
export function fmtAmount(value: string | number, decimals = 4): string {
  const n = Number(value);
  if (isNaN(n)) return "—";
  if (n === 0) return "0";
  if (n < 0.0001) return "< 0.0001";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

/** Format a USD dollar amount */
export function fmtUSD(value: string | number): string {
  const n = Number(value);
  if (isNaN(n)) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

/** Human-readable age from ISO timestamp: "3 min ago" */
export function timeAgo(isoTimestamp: string): string {
  try {
    return formatDistanceToNow(new Date(isoTimestamp), { addSuffix: true });
  } catch {
    return "unknown";
  }
}

/** Validate an Ethereum address (basic checksum-agnostic) */
export function isAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Sleep helper for polling loops */
export const sleep = (ms: number) =>
  new Promise<void>((r) => setTimeout(r, ms));

/** Copy text to clipboard, returns success bool */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Robinhood Chain network params for MetaMask wallet_addEthereumChain */
export const ROBINHOOD_CHAIN_PARAMS = {
  chainId:         "0x123B",          // 4663 in hex
  chainName:       "Robinhood Chain",
  nativeCurrency:  { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls:         ["https://rpc.mainnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
};
