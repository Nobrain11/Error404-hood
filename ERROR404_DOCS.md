# Error404 Trading Ecosystem — Full Documentation

**Version:** 1.0.0 | **Network:** Robinhood Chain (Chain ID: 4663) | **DEX:** Pons (UniswapV2)

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Getting Started](#2-getting-started)
3. [Web Application Guide](#3-web-application-guide)
4. [Telegram Bot Guide](#4-telegram-bot-guide)
5. [REST API Reference](#5-rest-api-reference)
6. [Smart Contract Reference](#6-smart-contract-reference)
7. [Architecture Deep Dive](#7-architecture-deep-dive)
8. [Developer Integration Guide](#8-developer-integration-guide)
9. [Security Model](#9-security-model)
10. [FAQ & Troubleshooting](#10-faq--troubleshooting)
11. [Support](#11-support)

---

## 1. Platform Overview

Error404 is a decentralised token trading ecosystem built on **Robinhood Chain** — an Ethereum Layer-2 network. It provides three integrated components:

| Component | Purpose | Access |
|-----------|---------|--------|
| **Web App** | Live token dashboard + trading terminal | Browser (Next.js) |
| **Telegram Bot** | Mobile trading via slash commands | @Error404Bot |
| **REST API** | Programmatic access to token data & auth | HTTPS endpoints |

### Core Technologies

- **Blockchain:** Robinhood Chain (EVM-compatible L2, chainId 4663)
- **DEX Protocol:** Pons — a UniswapV2-fork AMM (automated market maker)
- **Explorer:** Blockscout at `https://robinhoodchain.blockscout.com`
- **Price Discovery:** On-chain pool reserves (`getReserves()`)
- **Indexing:** Blockscout REST API v2 (free, no API key required)

---

## 2. Getting Started

### 2.1 Add Robinhood Chain to MetaMask

**Manual configuration:**

| Field | Value |
|-------|-------|
| Network Name | Robinhood Chain |
| RPC URL | `https://rpc.mainnet.chain.robinhood.com` |
| Chain ID | `4663` |
| Currency Symbol | ETH |
| Block Explorer | `https://robinhoodchain.blockscout.com` |

**Auto-add:** Connect your wallet on any page of the Error404 web app and you will be prompted to add the network automatically.

### 2.2 Funding Your Wallet

1. Bridge ETH from Ethereum mainnet using the official Robinhood bridge
2. Or purchase ETH directly through the Robinhood brokerage app
3. ETH is used for gas fees and as the base currency for all token swaps

### 2.3 Understanding Pons Pools

Every token on Pons has a liquidity pool paired with **WETH** (Wrapped ETH):

```
TOKEN/WETH pair
    Pool reserves: [tokenAmount, wethAmount]
    Price = wethAmount / tokenAmount
    Liquidity = wethAmount × 2
```

Price automatically adjusts with every trade via the constant-product formula (`x × y = k`).

---

## 3. Web Application Guide

### 3.1 Home Page

**Error404 Hero Section:**
- Shows live price, liquidity, and holder count for the Error404 (E404) token
- Data refreshes every 30 seconds from on-chain pool reserves
- "Trade E404 →" button links directly to the trading terminal

**Live Token Feed:**
- Displays the latest tokens deployed by the Pons factory contract
- Data sourced from Blockscout internal transaction API
- Auto-refreshes every 15 seconds
- Columns: Name, Symbol, Age, Holders, Verified status (✓ green / ⚠ yellow)
- Click any row to open the trading terminal for that token

**Search Bar:**
- Enter any token contract address (0x…) and press Enter
- Navigates directly to `/trade?token=<address>`
- Validates that the input is a valid Ethereum address format

### 3.2 Trading Terminal (`/trade`)

#### Accessing the Terminal

- Navigate to `/trade` (defaults to the Error404 token)
- Or `/trade?token=0x<address>` for any specific token
- Click any token in the home page feed

#### Connecting Your Wallet

1. Click **"Connect Wallet"** in the navigation bar
2. MetaMask will open — approve the connection
3. If on the wrong network, click **"Switch to Robinhood Chain"**
4. The button updates to show your shortened address when connected

#### Reading Pool Data

The terminal shows two key metrics updated every 20 seconds:

- **Price:** Current token price in ETH (calculated from reserves)
- **Liquidity:** Total pool depth in ETH (both sides combined)

#### Executing a Swap

**Buying (ETH → Token):**

1. Click the **Buy** tab
2. Enter the amount of ETH you want to spend
3. Review the quote:
   - **Expected output** — estimated tokens you'll receive
   - **Price impact** — how much your trade moves the price (green <2%, red >5%)
   - **Minimum received** — guaranteed minimum after slippage protection
4. Adjust **Slippage** (default 0.5%) if needed for volatile tokens
5. Click **"Buy [SYMBOL]"** and confirm in MetaMask

**Selling (Token → ETH):**

1. Click the **Sell** tab
2. Enter token amount or click **Max** to sell your full balance
3. First sell requires an **Approval** transaction (one-time per token per wallet)
4. Review quote and click **"Sell [SYMBOL]"**

#### Transaction History

All transactions are saved to browser `localStorage`:
- Transaction hash (links to Blockscout)
- Token address, amount, type (buy/sell)
- Timestamp and status

History persists across sessions. Last 50 transactions are stored.

#### Price Chart

The trading terminal embeds a **DEXScreener** iframe for the token's trading pair. If DEXScreener doesn't have data for a new token, the live price ticker from pool reserves serves as the fallback.

### 3.3 Bot Page (`/bot`)

- Step-by-step guide to connecting the Telegram bot
- API key generator (requires connected wallet)
- Generated keys are JWTs signed with HS256, valid 90 days
- Deep link: `t.me/Error404Bot?start=<apiKey>`

### 3.4 Docs Page (`/docs`)

This documentation rendered as a web page with full section navigation.

---

## 4. Telegram Bot Guide

### 4.1 Initial Setup

1. Open [@Error404Bot](https://t.me/Error404Bot) on Telegram
2. Press **Start** or send `/start`
3. Read the welcome message and security warning
4. Set up your trading wallet: `/setkey <yourPrivateKey>`

> ⚠️ **Critical:** Only use a dedicated **burner wallet** with a small ETH balance. Never use your main wallet.

### 4.2 Command Reference

#### `/start`
Displays the welcome message with quick-start instructions and links to the web app.

#### `/help`
Shows the complete command reference with usage examples.

---

#### `/price <tokenAddress>`

Fetches live on-chain data for any Pons token.

**Example:**
```
/price 0x1234567890123456789012345678901234567890
```

**Response includes:**
- Token name and symbol
- Current price in ETH (from pool reserves)
- Total pool liquidity in ETH
- Source verification status (Blockscout)
- Links to token and pair on the block explorer

---

#### `/buy <tokenAddress> <amountETH>`

Executes a market buy using your stored wallet.

**Example:**
```
/buy 0x1234567890123456789012345678901234567890 0.05
```

**Parameters:**
- `tokenAddress` — 0x-prefixed ERC20 contract address
- `amountETH` — Amount of ETH to spend (e.g., `0.01`, `0.5`)

**Behaviour:**
- Default slippage: **1%**
- Deadline: 5 minutes from submission
- Returns transaction hash with Blockscout link
- Transaction reverts on-chain if slippage limit is exceeded

---

#### `/sell <tokenAddress> <percent|max>`

Sells a percentage of your token balance.

**Examples:**
```
/sell 0x1234... 50     # Sell 50% of balance
/sell 0x1234... 100    # Sell full balance
/sell 0x1234... max    # Alias for 100%
```

**Parameters:**
- `tokenAddress` — ERC20 contract address
- `percent` — Integer 1–100, or the string `max`

**Behaviour:**
- Automatically approves the router if needed (one approval tx)
- Default slippage: **1%**
- Checks your actual on-chain balance before selling

---

#### `/setkey <privateKey>`

Stores your trading wallet's private key, encrypted in server memory.

**Example:**
```
/setkey 0xabc123...your64hexcharprivatekey...
```

**Security behaviour:**
- The message is immediately deleted from Telegram (best-effort)
- Key is AES-256-GCM encrypted before being stored
- Never written to disk, never logged
- Memory is cleared when the bot process restarts

---

#### `/mykey`

Displays your stored wallet address and masked private key.

**Example response:**
```
🔑 Stored Wallet

📍 Address: 0x1234...ABCD
🔐 Key (masked): 0xABCD…WXYZ
```

---

### 4.3 Bot Deployment

The bot uses **long polling** by default (suitable for VPS). For high-traffic production, switch to webhook mode:

```typescript
// In src/index.ts, replace bot.start() with:
await bot.api.setWebhook("https://yourdomain.com/webhook");
```

---

## 5. REST API Reference

All endpoints are relative to the deployed web app base URL.

**Base URL (example):** `https://error404.xyz`

**Authentication:** Not required for public endpoints. API keys use Bearer token format for future authenticated routes.

---

### `GET /api/tokens`

Returns the latest tokens created by the Pons factory contract.

**Query Parameters:** None

**Response:**

```json
[
  {
    "address": "0xabc123...",
    "name": "CoolToken",
    "symbol": "COOL",
    "timestamp": "2024-01-15T12:00:00.000Z",
    "verified": true,
    "holders": "42"
  },
  ...
]
```

**Notes:**
- Returns up to 30 most recent tokens
- Cached server-side for 12 seconds
- Verification status sourced from Blockscout

---

### `POST /api/apikey`

Generate a JWT API key linked to a wallet address.

**Request Body:**

```json
{
  "address": "0xYourWalletAddress"
}
```

**Response:**

```json
{
  "apiKey": "eyJhbGciOiJIUzI1NiJ9.eyJ3YWxsZXRBZGRyZXNzIjoiMHguLi4ifQ.signature"
}
```

**Notes:**
- JWT signed with HS256
- Expires after 90 days
- In production, gate this behind a SIWE (Sign-In With Ethereum) signature check

---

### `GET /api/apikey?key=<token>`

Validate an existing API key.

**Query Parameters:**
- `key` — The JWT API key to validate

**Response (valid):**

```json
{
  "valid": true,
  "address": "0xYourWalletAddress"
}
```

**Response (invalid/expired):**

```json
{
  "valid": false
}
```

---

### Blockscout Pass-through (via Next.js rewrite)

The web app rewrites `/blockscout/*` → `https://robinhoodchain.blockscout.com/api/v2/*` to avoid CORS.

**Example:**

```
GET /blockscout/tokens/0xabc...
→ https://robinhoodchain.blockscout.com/api/v2/tokens/0xabc...
```

Full Blockscout API documentation: https://robinhoodchain.blockscout.com/api-docs

---

## 6. Smart Contract Reference

### 6.1 Deployed Addresses

| Contract | Address | Notes |
|----------|---------|-------|
| Error404 Token (E404) | `0x0000000000000000000000000000000000000404` | Placeholder — update after deployment |
| Pons Factory | `0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f` | UniswapV2Factory |
| Pons Router | `0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D` | UniswapV2Router02 |
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` | Update for Robinhood Chain |

> ⚠️ These are placeholder addresses. Verify the actual Pons deployment on `https://robinhoodchain.blockscout.com` before trading.

### 6.2 Key Contract Functions

**UniswapV2Router02 — Buying:**

```solidity
function swapExactETHForTokens(
    uint amountOutMin,       // Minimum tokens to receive (slippage guard)
    address[] calldata path, // [WETH, tokenAddress]
    address to,              // Recipient (your wallet)
    uint deadline            // Unix timestamp expiry
) external payable returns (uint[] memory amounts);
```

**UniswapV2Router02 — Selling:**

```solidity
function swapExactTokensForETH(
    uint amountIn,           // Token amount to sell
    uint amountOutMin,       // Minimum ETH to receive
    address[] calldata path, // [tokenAddress, WETH]
    address to,              // Recipient
    uint deadline
) external returns (uint[] memory amounts);
```

**UniswapV2Pair — Price Discovery:**

```solidity
function getReserves() external view returns (
    uint112 reserve0,
    uint112 reserve1,
    uint32  blockTimestampLast
);
// price = reserve_weth / reserve_token
```

### 6.3 Pair Address Computation (CREATE2)

Pair addresses are deterministic — computed without an RPC call:

```typescript
import { ethers } from "ethers";

const INIT_CODE_HASH = "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";

function computePairAddress(factory: string, tokenA: string, tokenB: string): string {
  // Sort tokens ascending
  const [t0, t1] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
  const salt = ethers.keccak256(
    ethers.concat([ethers.zeroPadValue(t0, 32), ethers.zeroPadValue(t1, 32)])
  );
  return ethers.getCreate2Address(factory, salt, INIT_CODE_HASH);
}
```

---

## 7. Architecture Deep Dive

### 7.1 Web App Architecture

```
Browser
  │
  ├── Next.js App Router (SSR + ISR)
  │     ├── /                → Home: hero + token feed
  │     ├── /trade           → Trading terminal (client component)
  │     ├── /bot             → Bot guide + API key generation
  │     ├── /docs            → Documentation hub
  │     └── /api/
  │           ├── tokens/    → Blockscout proxy + token aggregation
  │           └── apikey/    → JWT generation/validation
  │
  ├── React Context (WalletProvider)
  │     ├── ethers.BrowserProvider (MetaMask)
  │     ├── wallet_switchEthereumChain (Robinhood Chain)
  │     └── accountsChanged / chainChanged listeners
  │
  ├── SWR Data Fetching
  │     ├── /api/tokens — 15s refresh interval
  │     └── Blockscout token/pool data — 20s refresh
  │
  └── On-chain interactions (lib/pons.ts)
        ├── JsonRpcProvider → getPoolData()
        ├── ethers.Contract → getAmountsOut() [quoting]
        └── BrowserProvider.getSigner() → swap execution
```

### 7.2 Telegram Bot Architecture

```
Telegram Servers
      │ (long polling)
      ▼
grammY Bot Framework
      │
      ├── Middleware: request logging (redacts /setkey)
      │
      ├── Command Router
      │     ├── /start, /help   → Static text responses
      │     ├── /price          → pons.getTokenPrice() + Blockscout
      │     ├── /buy            → pons.executeSwap("buy", ...)
      │     ├── /sell           → pons.getTokenBalance() + executeSwap("sell", ...)
      │     └── /setkey         → auth.storeKey() [encrypted]
      │
      ├── services/pons.ts
      │     ├── JsonRpcProvider (Robinhood Chain RPC)
      │     ├── UniswapV2Factory.getPair()
      │     ├── UniswapV2Pair.getReserves()
      │     └── UniswapV2Router02.swapExact*()
      │
      └── services/auth.ts
            ├── AES-256-GCM encryption (Node.js crypto)
            ├── In-memory Map<userId, encryptedKey>
            └── jose JWT for API key auth
```

### 7.3 Data Flow: Token Price

```
1. User requests price
2. getPairAddress(token)
     a. Call Factory.getPair(token, WETH) via RPC
     b. Fallback: compute CREATE2 address locally
3. Call Pair.getReserves() → [r0, r1, timestamp]
4. Determine which reserve is WETH (via Pair.token0())
5. price = formatEther(wethReserve) / formatUnits(tokenReserve, 18)
6. liquidity = formatEther(wethReserve) × 2
```

### 7.4 Data Flow: Token Feed

```
1. Client polls /api/tokens every 15s
2. Server fetches factory internal-transactions from Blockscout
3. Filter: type === "create" events only
4. Parallel fetch: Blockscout /tokens/{address} for each contract
5. Aggregate: name, symbol, timestamp, verified, holders
6. Return sorted array (newest first)
```

---

## 8. Developer Integration Guide

### 8.1 Self-hosting the Web App

**Requirements:**
- Node.js 18+
- A server or Vercel/Netlify account

**Quick start:**

```bash
git clone https://github.com/error404-chain/error404-web
cd error404-web
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your contract addresses and secrets

npm run dev        # development
npm run build      # production build
npm start          # production server
```

**Vercel deployment:**

```bash
npx vercel --prod
# Set env vars in Vercel dashboard or via vercel env add
```

### 8.2 Self-hosting the Telegram Bot

```bash
git clone https://github.com/error404-chain/error404-bot
cd error404-bot
npm install

cp .env.example .env
# Edit .env — set BOT_TOKEN, ENCRYPTION_SECRET, JWT_SECRET

npm run build
npm start
```

**Docker:**

```bash
docker build -t error404-bot .
docker run -d \
  --name error404-bot \
  --restart unless-stopped \
  --env-file .env \
  error404-bot
```

### 8.3 Using the Pons Library

The `lib/pons.ts` (web) and `src/services/pons.ts` (bot) can be used as standalone modules:

```typescript
import { getPoolData, getBuyQuote, executeBuy } from "./lib/pons";
import { BrowserProvider } from "ethers";

// Get pool data
const pool = await getPoolData("0xTokenAddress");
console.log(`Price: ${pool.priceInETH} ETH`);
console.log(`Liquidity: ${pool.liquidityETH} ETH`);

// Get buy quote
const quote = await getBuyQuote("0xTokenAddress", "0.1", 0.5);
console.log(`Expected: ${ethers.formatUnits(quote.amountOut, 18)} tokens`);
console.log(`Impact: ${quote.priceImpact.toFixed(2)}%`);

// Execute buy (browser)
const provider = new BrowserProvider(window.ethereum);
const signer   = await provider.getSigner();
const txHash   = await executeBuy(signer, "0xTokenAddress", "0.1", 0.5);
```

### 8.4 Customising for a Different Factory

Update these environment variables to point to a different Pons/UniswapV2 deployment:

```bash
# .env.local (web) or .env (bot)
NEXT_PUBLIC_FACTORY_ADDRESS=0xYourFactoryAddress
NEXT_PUBLIC_ROUTER_ADDRESS=0xYourRouterAddress
NEXT_PUBLIC_WETH_ADDRESS=0xYourWETHAddress
```

If the factory uses a different `INIT_CODE_HASH` (non-standard UniswapV2 fork), update the constant in `lib/pons.ts`:

```typescript
const INIT_CODE_HASH = "0xYourInitCodeHash";
```

---

## 9. Security Model

### 9.1 Web Application

| Risk | Mitigation |
|------|-----------|
| CORS exposure of Blockscout API | Server-side proxy via Next.js rewrites |
| Slippage attacks | User-configurable slippage + on-chain minimum received check |
| Infinite approval | `approve(router, MaxUint256)` — standard practice; users should be aware |
| Malicious tokens (honeypots) | Verification badge; users trade at own risk |
| API key forgery | JWT signed with HS256 server secret; verify on every auth request |

### 9.2 Telegram Bot

| Risk | Mitigation |
|------|-----------|
| Private key exposure | AES-256-GCM encryption; never logged; message deleted immediately |
| Key persistence | In-memory only; cleared on restart |
| Replay attacks | JWT expiry (90 days); nonce can be added for high-security environments |
| RPC manipulation | Signed transactions; router validates paths on-chain |
| Unauthorised trading | Keys are per-userId; swap requires decrypted key from that user's store |

### 9.3 On-chain Safety

- All swaps go through the audited UniswapV2 Router — no custom swap logic
- `amountOutMin` is always set (slippage protection)
- Swap deadline prevents miners from holding and replaying transactions
- Token approval uses `MaxUint256` (standard) — consider using exact amounts for maximum security

### 9.4 Recommended Security Practices for Users

1. **Use burner wallets** for the Telegram bot — never your main holdings
2. **Verify token addresses** on Blockscout before trading
3. **Check verification status** — unverified tokens (⚠) carry higher risk
4. **Start small** — test with minimal amounts before scaling
5. **Monitor slippage** — high price impact signals low liquidity

---

## 10. FAQ & Troubleshooting

### Q: "Token not found" error on the trade page
**A:** The token address may not be a Pons token, or may not have a liquidity pool yet. Verify the address on [Blockscout](https://robinhoodchain.blockscout.com).

### Q: Transaction reverts with "insufficient output amount"
**A:** Your slippage tolerance is too low for current market volatility. Increase slippage to 1–2% in the trade interface, or use `/buy` with the bot (1% default).

### Q: MetaMask doesn't show the "Switch Network" prompt
**A:** Try manually adding Robinhood Chain (see Section 2.1). If that fails, check that MetaMask is updated to the latest version.

### Q: The bot says "Failed to decrypt your key"
**A:** The bot was likely restarted, clearing the in-memory key store. Use `/setkey` again to re-register your key.

### Q: Price impact is very high (>10%)
**A:** The token has low liquidity. Consider buying a smaller amount, or waiting for more liquidity to be added to the pool.

### Q: `/sell max` only sold 99.99% of my balance
**A:** Some tokens have reflection/tax mechanisms that affect balances. The `max` option reads your balance at time of execution — minor rounding is normal.

### Q: The token feed shows "No tokens found yet"
**A:** The factory may not have created any tokens recently, or Blockscout may be temporarily slow. Wait 15 seconds for the next auto-refresh.

### Q: Blockscout shows my transaction as "pending" for a long time
**A:** Robinhood Chain may be congested. Check the block explorer for network status. Your transaction is not lost — it will be included when gas conditions allow.

### Q: How do I find the pair address for a token?
**A:** The trading terminal shows the pair address under "Token Details". Alternatively, use the `computePairAddress()` function from `lib/pons.ts`, or call `Factory.getPair(token, WETH)` directly.

---

## 11. Support

| Channel | Link | Response Time |
|---------|------|---------------|
| Telegram Support | [@Error404Support](https://t.me/Error404Support) | < 24 hours |
| GitHub Issues | [github.com/error404-chain](https://github.com/error404-chain) | < 48 hours |
| Block Explorer | [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com) | N/A |
| Pons DEX | [pons.exchange](https://pons.exchange) | N/A |

---

*Error404 is open-source software. Trading cryptocurrencies involves significant risk. Always do your own research and never invest more than you can afford to lose.*

*Documentation version 1.0.0 — Robinhood Chain (chainId 4663)*
