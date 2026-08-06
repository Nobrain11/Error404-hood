# Error404 Telegram Bot

Mobile trading interface for the Error404 ecosystem on Robinhood Chain (chain ID 4663).

## Features

- 📊 Live token prices from Pons (UniswapV2) pool reserves
- ⚡ One-command buy/sell swaps with slippage protection
- 🔐 AES-256-GCM encrypted private key storage (in-memory only)
- ✅ Blockscout source verification status
- 🔗 Direct transaction links to Blockscout explorer

## Prerequisites

- Node.js 18+
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- A Robinhood Chain RPC endpoint

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env .env.local
# Edit .env.local with your values:
# - BOT_TOKEN from BotFather
# - ENCRYPTION_SECRET: random 32+ char string
# - JWT_SECRET: different random 32+ char string
```

### 3. Run in development

```bash
npm run dev
```

### 4. Build and run in production

```bash
npm run build
npm start
```

## Deployment (Production)

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

```bash
docker build -t error404-bot .
docker run -d --env-file .env error404-bot
```

### PM2 (VPS)

```bash
npm run build
pm2 start dist/index.js --name error404-bot
pm2 save
pm2 startup
```

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome and quick start guide |
| `/help` | Full command reference |
| `/price <address>` | Live price, liquidity, verification |
| `/buy <address> <ethAmount>` | Buy tokens with ETH (1% slippage) |
| `/sell <address> <percent\|max>` | Sell token balance percentage |
| `/setkey <privateKey>` | Store burner wallet private key |
| `/mykey` | Show masked wallet address |

## Security Architecture

```
User → Telegram → Bot Server
                      ↓
              AES-256-GCM encrypt
                      ↓
              In-memory Map<userId, encryptedKey>
                      ↓ (on swap)
              Decrypt → ethers.Wallet → sign tx → Robinhood Chain
```

- Private keys are **never** logged or written to disk
- Memory is cleared on bot restart — users must `/setkey` again
- GCM authentication tag protects against tampering
- All swap transactions revert on-chain if slippage limit is exceeded

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Telegram bot token from BotFather | ✅ |
| `RPC_URL` | Robinhood Chain RPC endpoint | ✅ |
| `ENCRYPTION_SECRET` | AES key for private key encryption | ✅ |
| `JWT_SECRET` | Secret for API key JWTs | ✅ |
| `FACTORY_ADDRESS` | Pons factory contract | ✅ |
| `ROUTER_ADDRESS` | Pons/UniswapV2 router | ✅ |
| `WETH_ADDRESS` | Wrapped ETH on Robinhood Chain | ✅ |
| `ERROR404_TOKEN` | Error404 token contract address | ✅ |
| `WEB_APP_URL` | Web app URL for deep links | Optional |
| `BLOCKSCOUT_URL` | Blockscout API base URL | Optional |
