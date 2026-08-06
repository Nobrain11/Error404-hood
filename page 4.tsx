/**
 * Docs Page — /docs
 * Full platform documentation for Error404.
 */

import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-16">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-4xl text-brand-text mb-3">
          Documentation
        </h1>
        <p className="text-brand-dim text-lg">
          Everything you need to trade, build, and integrate with the Error404 ecosystem.
        </p>
      </div>

      {/* Table of contents */}
      <nav className="rounded-xl border border-brand-border bg-brand-surface p-6">
        <h2 className="font-display font-semibold text-brand-text mb-4">Contents</h2>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          {TOC.map(({ id, title }) => (
            <li key={id}>
              <a href={`#${id}`}
                 className="text-brand-green hover:underline font-mono">
                → {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sections */}
      <DocSection id="overview" title="1. Overview">
        <p>
          Error404 is a decentralised token launchpad and trading terminal built on{" "}
          <strong className="text-brand-text">Robinhood Chain</strong> (chain ID 4663),
          an Ethereum Layer-2 network. It integrates with the <strong className="text-brand-text">Pons</strong>{" "}
          automated market maker — a UniswapV2-compatible DEX — to provide instant, permissionless token swaps.
        </p>
        <p>The ecosystem consists of three components:</p>
        <ul className="list-disc list-inside space-y-1 text-brand-dim">
          <li><strong className="text-brand-text">Web App</strong> — live dashboard and trading terminal at this site.</li>
          <li><strong className="text-brand-text">Telegram Bot</strong> — mobile trading via @Error404Bot.</li>
          <li><strong className="text-brand-text">API</strong> — REST endpoints for programmatic access.</li>
        </ul>
      </DocSection>

      <DocSection id="getting-started" title="2. Getting Started">
        <h3 className="font-display font-semibold text-brand-text mt-4 mb-2">
          2.1 Network Configuration
        </h3>
        <p>Add Robinhood Chain to your wallet:</p>
        <CodeBlock>{`Network Name:   Robinhood Chain
RPC URL:        https://rpc.mainnet.chain.robinhood.com
Chain ID:       4663
Currency:       ETH
Block Explorer: https://robinhoodchain.blockscout.com`}</CodeBlock>
        <p className="mt-4">
          Or click <strong className="text-brand-text">Connect Wallet</strong> on any page — the
          site will prompt MetaMask to add the network automatically.
        </p>

        <h3 className="font-display font-semibold text-brand-text mt-6 mb-2">
          2.2 Funding Your Wallet
        </h3>
        <p>
          Bridge ETH to Robinhood Chain using the official Robinhood bridge, or purchase
          directly through the Robinhood app. You need ETH to pay gas and to buy tokens.
        </p>
      </DocSection>

      <DocSection id="trading" title="3. Trading">
        <h3 className="font-display font-semibold text-brand-text mt-4 mb-2">3.1 Buying Tokens</h3>
        <ol className="list-decimal list-inside space-y-2 text-brand-dim">
          <li>Navigate to <Link href="/trade" className="text-brand-green underline">/trade</Link> or click a token in the feed.</li>
          <li>Connect your wallet (MetaMask or any EIP-1193 provider).</li>
          <li>Enter the ETH amount you want to spend in the <strong className="text-brand-text">Buy</strong> tab.</li>
          <li>Review the quote: expected output, price impact, and minimum received.</li>
          <li>Click <strong className="text-brand-text">Buy [SYMBOL]</strong> and confirm in your wallet.</li>
        </ol>

        <h3 className="font-display font-semibold text-brand-text mt-6 mb-2">3.2 Selling Tokens</h3>
        <ol className="list-decimal list-inside space-y-2 text-brand-dim">
          <li>Switch to the <strong className="text-brand-text">Sell</strong> tab.</li>
          <li>Enter the token amount to sell, or click <strong className="text-brand-text">Max</strong>.</li>
          <li>The first sell from a new wallet requires an <em>approval</em> transaction.</li>
          <li>Confirm the swap transaction in your wallet.</li>
        </ol>

        <h3 className="font-display font-semibold text-brand-text mt-6 mb-2">3.3 Slippage Tolerance</h3>
        <p>
          Default slippage is <strong className="text-brand-text">0.5%</strong>. Increase it for
          low-liquidity tokens. Transactions revert if the actual received amount falls below
          the <em>minimum received</em> shown in the quote.
        </p>

        <h3 className="font-display font-semibold text-brand-text mt-6 mb-2">3.4 Price Impact</h3>
        <p>
          Price impact measures how much your trade moves the pool price. Keep it below{" "}
          <span className="text-brand-green font-mono">2%</span> for best execution.
          Trades above <span className="text-brand-red font-mono">5%</span> are highlighted in red.
        </p>
      </DocSection>

      <DocSection id="contracts" title="4. Contract Addresses">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border text-brand-dim font-mono text-xs uppercase">
              <th className="text-left py-2 pr-4">Contract</th>
              <th className="text-left py-2">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/50">
            {[
              { name: "Error404 Token",    addr: "0x0000000000000000000000000000000000000404" },
              { name: "Pons Factory",      addr: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f" },
              { name: "Pons Router",       addr: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" },
              { name: "WETH",              addr: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
            ].map(({ name, addr }) => (
              <tr key={name}>
                <td className="py-2.5 pr-4 text-brand-text font-medium">{name}</td>
                <td className="py-2.5">
                  <a
                    href={`https://robinhoodchain.blockscout.com/address/${addr}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-brand-green text-xs hover:underline"
                  >
                    {addr}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DocSection>

      <DocSection id="api" title="5. REST API Reference">
        <p className="mb-4">
          The Error404 web app exposes a small REST API for programmatic access.
          All endpoints are relative to the base URL of the deployed web app.
        </p>

        <ApiEndpoint
          method="GET"
          path="/api/tokens"
          desc="Returns the latest tokens created by the Pons factory."
          response={`[
  {
    "address":   "0xabc…",
    "name":      "CoolToken",
    "symbol":    "COOL",
    "timestamp": "2024-01-15T12:00:00Z",
    "verified":  true,
    "holders":   "42"
  }
]`}
        />

        <ApiEndpoint
          method="POST"
          path="/api/apikey"
          desc="Generate a JWT API key for Telegram bot authentication."
          request={`{ "address": "0xYourWalletAddress" }`}
          response={`{ "apiKey": "eyJhbG…" }`}
        />

        <ApiEndpoint
          method="GET"
          path="/api/apikey?key=<token>"
          desc="Validate an existing API key."
          response={`{ "valid": true, "address": "0xabc…" }`}
        />
      </DocSection>

      <DocSection id="bot-api" title="6. Telegram Bot Reference">
        <div className="space-y-4">
          {BOT_COMMANDS.map(({ cmd, args, desc, example }) => (
            <div key={cmd} className="rounded-lg border border-brand-border bg-brand-surface p-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <code className="text-brand-green font-mono text-sm">{cmd}</code>
                {args && <code className="text-brand-dim font-mono text-xs">{args}</code>}
              </div>
              <p className="text-brand-dim text-sm mb-2">{desc}</p>
              {example && (
                <code className="block text-xs text-brand-amber font-mono bg-brand-bg px-3 py-2 rounded">
                  {example}
                </code>
              )}
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="security" title="7. Security">
        <ul className="space-y-3 text-brand-dim">
          {[
            "Private keys submitted to the bot are encrypted with AES-256-GCM and stored in memory only. They are never written to disk or logged.",
            "API keys are JWTs signed with HS256. They expire after 90 days.",
            "All swap transactions are signed client-side (web app) or by the bot server using the encrypted key. The server never transmits private keys in plaintext.",
            "Slippage protection ensures you receive at least the quoted minimum. Transactions revert on-chain if the limit is breached.",
            "Always use dedicated burner wallets with small balances for the Telegram bot.",
          ].map((item, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-brand-green shrink-0">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="support" title="8. Support">
        <p>
          For bugs, feature requests, or questions:
        </p>
        <ul className="list-disc list-inside space-y-2 text-brand-dim mt-3">
          <li>Telegram: <a href="https://t.me/Error404Support" className="text-brand-green hover:underline">@Error404Support</a></li>
          <li>GitHub: <a href="https://github.com/error404-chain" className="text-brand-green hover:underline">github.com/error404-chain</a></li>
          <li>Block Explorer: <a href="https://robinhoodchain.blockscout.com" className="text-brand-green hover:underline">robinhoodchain.blockscout.com</a></li>
        </ul>
      </DocSection>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function DocSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="font-display font-bold text-2xl text-brand-text border-b border-brand-border pb-3">
        {title}
      </h2>
      <div className="space-y-4 text-brand-dim leading-relaxed">{children}</div>
    </section>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="rounded-lg bg-brand-bg border border-brand-border px-4 py-3
                    font-mono text-xs text-brand-green overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function ApiEndpoint({
  method, path, desc, request, response,
}: { method: string; path: string; desc: string; request?: string; response: string }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-3 mt-4">
      <div className="flex items-center gap-3">
        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold
          ${method === "GET" ? "bg-brand-green/10 text-brand-green border border-brand-green/30"
                             : "bg-brand-amber/10 text-brand-amber border border-brand-amber/30"}`}>
          {method}
        </span>
        <code className="text-brand-text font-mono text-sm">{path}</code>
      </div>
      <p className="text-brand-dim text-sm">{desc}</p>
      {request && (
        <div>
          <p className="text-brand-dim text-xs font-mono mb-1">Request body:</p>
          <pre className="text-brand-amber font-mono text-xs bg-brand-bg px-3 py-2 rounded overflow-x-auto">
            {request}
          </pre>
        </div>
      )}
      <div>
        <p className="text-brand-dim text-xs font-mono mb-1">Response:</p>
        <pre className="text-brand-green font-mono text-xs bg-brand-bg px-3 py-2 rounded overflow-x-auto">
          {response}
        </pre>
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TOC = [
  { id: "overview",       title: "Overview" },
  { id: "getting-started", title: "Getting Started" },
  { id: "trading",        title: "Trading" },
  { id: "contracts",      title: "Contract Addresses" },
  { id: "api",            title: "REST API Reference" },
  { id: "bot-api",        title: "Telegram Bot Reference" },
  { id: "security",       title: "Security" },
  { id: "support",        title: "Support" },
];

const BOT_COMMANDS = [
  {
    cmd: "/start",
    args: "",
    desc: "Displays a welcome message with a link to the web app and a brief explanation of the bot's capabilities.",
    example: "",
  },
  {
    cmd: "/help",
    args: "",
    desc: "Lists all available commands with usage examples.",
    example: "",
  },
  {
    cmd: "/price",
    args: "<tokenAddress>",
    desc: "Fetches the current token price in ETH, total pool liquidity, and source verification status from Blockscout.",
    example: "/price 0xabc123...",
  },
  {
    cmd: "/buy",
    args: "<tokenAddress> <amountInETH>",
    desc: "Buys the specified token using the wallet set via /setkey. Default slippage is 1%. Returns the transaction hash.",
    example: "/buy 0xabc123... 0.1",
  },
  {
    cmd: "/sell",
    args: "<tokenAddress> <percent|max>",
    desc: "Sells a percentage of your token balance. Use 'max' to sell the full balance.",
    example: "/sell 0xabc123... 50",
  },
  {
    cmd: "/setkey",
    args: "<privateKey>",
    desc: "Stores your wallet private key encrypted server-side. ⚠️ Only use burner wallets. The key is AES-256-GCM encrypted and never logged.",
    example: "/setkey 0xYourPrivateKey",
  },
  {
    cmd: "/mykey",
    args: "",
    desc: "Shows your stored key in masked format (first 6 and last 4 characters).",
    example: "",
  },
];
