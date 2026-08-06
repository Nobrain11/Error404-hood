/**
 * Bot Page — /bot
 * Instructions for the Telegram bot + API key generation.
 */

"use client";

import { useState } from "react";
import { useWallet } from "@/components/WalletContext";
import { copyToClipboard } from "@/lib/utils";

const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME ?? "Error404Bot";

export default function BotPage() {
  const { address, connect } = useWallet();
  const [apiKey,    setApiKey]    = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function generateKey() {
    if (!address) { await connect(); return; }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/apikey", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ address }),
      });
      const data = await res.json();
      if (data.apiKey) setApiKey(data.apiKey);
      else setError(data.error ?? "Failed to generate key.");
    } catch {
      setError("Network error — try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(text: string) {
    const ok = await copyToClipboard(text);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  const botLink = apiKey
    ? `https://t.me/${BOT_USERNAME}?start=${apiKey}`
    : `https://t.me/${BOT_USERNAME}`;

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="font-display font-bold text-4xl text-brand-text mb-2">
          Telegram <span className="text-brand-green">Bot</span>
        </h1>
        <p className="text-brand-dim text-lg">
          Trade Error404 tokens from your phone with simple slash commands.
        </p>
      </div>

      {/* Setup steps */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-xl text-brand-text">Quick Setup</h2>
        <div className="space-y-3">
          {[
            {
              n: 1,
              title: "Open the bot",
              body: (
                <span>
                  Go to{" "}
                  <a href={botLink} target="_blank" rel="noreferrer"
                     className="text-brand-green underline hover:opacity-80">
                    t.me/{BOT_USERNAME}
                  </a>{" "}
                  on Telegram and press <strong className="text-brand-text">Start</strong>.
                </span>
              ),
            },
            {
              n: 2,
              title: "Generate your API key",
              body: "Click the button below (connect your wallet first). This JWT links your Telegram session to your wallet address.",
            },
            {
              n: 3,
              title: "Set your trading wallet",
              body: "Send /setkey <privateKey> to the bot to enable trading. ⚠️ Use a dedicated burner wallet — never your main wallet.",
            },
            {
              n: 4,
              title: "Start trading",
              body: "Use /price, /buy, and /sell to interact with any Pons token on Robinhood Chain.",
            },
          ].map(({ n, title, body }) => (
            <div key={n} className="flex gap-4 p-5 rounded-xl border border-brand-border bg-brand-surface">
              <span className="shrink-0 w-8 h-8 rounded-full bg-brand-green/10 border border-brand-green/30
                               flex items-center justify-center text-brand-green font-mono font-bold text-sm">
                {n}
              </span>
              <div>
                <p className="font-display font-semibold text-brand-text mb-1">{title}</p>
                <p className="text-brand-dim text-sm leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* API Key generation */}
      <section className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-4">
        <h2 className="font-display font-semibold text-xl text-brand-text">Your API Key</h2>
        <p className="text-brand-dim text-sm">
          This key authenticates your bot session. It is valid for 90 days.
          Never share it publicly.
        </p>

        {!apiKey ? (
          <button
            onClick={generateKey}
            disabled={generating}
            className="px-6 py-3 rounded-lg bg-brand-green text-brand-bg font-display
                       font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? "Generating…" : address ? "Generate API Key" : "Connect Wallet First"}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <code className="block w-full px-4 py-3 rounded-lg bg-brand-bg border border-brand-border
                               font-mono text-xs text-brand-green break-all pr-20">
                {apiKey}
              </code>
              <button
                onClick={() => handleCopy(apiKey)}
                className="absolute right-2 top-2 px-2 py-1 rounded text-xs font-mono
                           border border-brand-border text-brand-dim hover:text-brand-text transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <a
              href={botLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
                         bg-[#229ED9] text-white font-display font-semibold text-sm
                         hover:opacity-90 transition-opacity"
            >
              ✈ Open in Telegram
            </a>
          </div>
        )}
        {error && <p className="text-brand-red text-sm font-mono">{error}</p>}
      </section>

      {/* Command reference */}
      <section className="space-y-4">
        <h2 className="font-display font-semibold text-xl text-brand-text">Commands</h2>
        <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
          {[
            { cmd: "/start",                          desc: "Welcome message and bot overview" },
            { cmd: "/help",                           desc: "Show all available commands" },
            { cmd: "/price <tokenAddress>",           desc: "Get live price, liquidity, and verification status" },
            { cmd: "/buy <tokenAddress> <amountETH>", desc: "Buy tokens with ETH (1% default slippage)" },
            { cmd: "/sell <tokenAddress> <percent>",  desc: "Sell % of your token balance (or 'max')" },
            { cmd: "/setkey <privateKey>",            desc: "Store your trading wallet (⚠️ burner wallets only)" },
            { cmd: "/mykey",                          desc: "Show your masked stored key" },
          ].map(({ cmd, desc }, i) => (
            <div key={i}
              className={`flex flex-col sm:flex-row gap-1 sm:gap-6 px-4 py-3 text-sm
                          ${i % 2 === 0 ? "" : "bg-brand-bg/30"}`}>
              <code className="text-brand-green font-mono shrink-0 sm:w-64">{cmd}</code>
              <span className="text-brand-dim">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Security warning */}
      <div className="rounded-xl border border-brand-amber/30 bg-brand-amber/5 p-5">
        <h3 className="font-display font-semibold text-brand-amber mb-2">⚠ Security Notice</h3>
        <ul className="text-brand-dim text-sm space-y-1 list-disc list-inside">
          <li>Private keys submitted via /setkey are encrypted server-side but still leave your device.</li>
          <li>Only use dedicated burner wallets with small amounts you can afford to lose.</li>
          <li>The Error404 team will never DM you asking for your private key.</li>
          <li>Keys are stored in memory only — they clear if the bot restarts.</li>
        </ul>
      </div>
    </div>
  );
}
