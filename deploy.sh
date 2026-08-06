#!/usr/bin/env bash
# ============================================================
# Error404 Ecosystem — One-Shot Deploy Script
# Deploys both the web app (Vercel) and bot (Docker/PM2)
# ============================================================
set -e

echo "╔══════════════════════════════════════════╗"
echo "║   Error404 Ecosystem — Deploy Script     ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Web App ─────────────────────────────────────────────────
echo "▶ [1/4] Installing web app dependencies…"
cd error404-web
npm install

echo "▶ [2/4] Building web app…"
npm run build

echo "▶ [3/4] Deploying web app to Vercel…"
if command -v vercel &> /dev/null; then
  vercel --prod --yes
else
  echo "  ⚠ Vercel CLI not found. Run: npm i -g vercel && vercel --prod"
fi
cd ..

# ── Telegram Bot ─────────────────────────────────────────────
echo "▶ [4/4] Building and starting Telegram bot…"
cd error404-bot
npm install
npm run build

if command -v pm2 &> /dev/null; then
  pm2 start dist/index.js --name error404-bot --restart-delay=5000
  pm2 save
  echo "  ✅ Bot started with PM2. Monitor: pm2 logs error404-bot"
elif command -v docker &> /dev/null; then
  docker build -t error404-bot .
  docker run -d --name error404-bot --restart unless-stopped --env-file .env error404-bot
  echo "  ✅ Bot started in Docker. Logs: docker logs -f error404-bot"
else
  echo "  ℹ Run manually: npm start"
fi
cd ..

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Deploy complete! ✅                    ║"
echo "║                                          ║"
echo "║   ✔ Web App:  check Vercel dashboard     ║"
echo "║   ✔ Bot:      @Error404Bot on Telegram   ║"
echo "║   ✔ Docs:     /docs on your web app      ║"
echo "╚══════════════════════════════════════════╝"
