/**
 * Home page — Error404 hero + live token feed.
 */

"use client";

import Link from "next/link";
import useSWR from "swr";
import { fmtAmount, fmtUSD } from "@/lib/utils";
import { fetchToken } from "@/lib/blockscout";
import { getPoolData } from "@/lib/pons";
import TokenFeed from "@/components/TokenFeed";
import { useEffect, useState } from "react";

const ERROR404_TOKEN =
  process.env.NEXT_PUBLIC_ERROR404_TOKEN ??
  "0x0000000000000000000000000000000000000404";

interface HeroData {
  name:        string;
  symbol:      string;
  priceInETH:  number;
  liquidityETH: number;
  holders:     string;
}

export default function HomePage() {
  const [hero, setHero] = useState<HeroData | null>(null);
  const [heroLoading, setHeroLoading] = useState(true);

  useEffect(() => {
    async function loadHero() {
      try {
        const [token, pool] = await Promise.all([
          fetchToken(ERROR404_TOKEN),
          getPoolData(ERROR404_TOKEN),
        ]);
        setHero({
          name:         token.name,
          symbol:       token.symbol,
          priceInETH:   pool.priceInETH,
          liquidityETH: pool.liquidityETH,
          holders:      token.holders,
        });
      } catch {
        // Token may not exist on this chain yet — show placeholder
        setHero({
          name: "Error404", symbol: "E404",
          priceInETH: 0, liquidityETH: 0, holders: "0",
        });
      } finally {
        setHeroLoading(false);
      }
    }
    loadHero();
    const interval = setInterval(loadHero, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-12">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl border border-brand-border
                          bg-brand-surface px-8 py-12 text-center">
        {/* Ambient glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full bg-brand-green/5 blur-3xl" />
        </div>

        <div className="relative z-10 space-y-6">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                           border border-brand-green/30 bg-brand-green/10
                           text-brand-green text-xs font-mono uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            Live on Robinhood Chain
          </span>

          {/* Title */}
          <h1 className="font-display font-bold text-5xl sm:text-6xl text-brand-text">
            Error<span className="text-brand-green">404</span>
          </h1>
          <p className="text-brand-dim font-body max-w-lg mx-auto text-lg">
            The premier token launchpad and trading terminal on Robinhood Chain.
            Fair launches. Real liquidity. No rugs.
          </p>

          {/* Stats */}
          {heroLoading ? (
            <div className="text-brand-dim font-mono text-sm animate-pulse">Loading…</div>
          ) : hero ? (
            <div className="flex flex-wrap justify-center gap-8">
              <HeroStat label="Price"      value={`${hero.priceInETH.toExponential(4)} ETH`} />
              <HeroStat label="Liquidity"  value={`${fmtAmount(hero.liquidityETH)} ETH`}     />
              <HeroStat label="Holders"    value={Number(hero.holders).toLocaleString()}      />
            </div>
          ) : null}

          {/* CTA */}
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href={`/trade?token=${ERROR404_TOKEN}`}
              className="px-8 py-3 rounded-xl bg-brand-green text-brand-bg
                         font-display font-bold text-sm hover:opacity-90
                         transition-opacity shadow-lg shadow-brand-green/20"
            >
              Trade E404 →
            </Link>
            <Link
              href="/docs"
              className="px-8 py-3 rounded-xl border border-brand-border
                         text-brand-text font-display font-medium text-sm
                         hover:border-brand-green transition-colors"
            >
              Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* ── Token Feed ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-xl text-brand-text">
            Latest Tokens
          </h2>
          <span className="flex items-center gap-1.5 text-brand-dim text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
            Live · refreshes every 15s
          </span>
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
          <TokenFeed />
        </div>
      </section>

      {/* ── Bottom CTA row ── */}
      <section className="grid sm:grid-cols-3 gap-4">
        {[
          {
            icon: "⚡",
            title: "Instant Swaps",
            body:  "Trade any Pons token at market price with 1-click execution.",
          },
          {
            icon: "🤖",
            title: "Telegram Bot",
            body:  "Trade on the go from your phone with /buy and /sell commands.",
          },
          {
            icon: "🔍",
            title: "Transparent",
            body:  "All data sourced from Blockscout — no black boxes, no hidden fees.",
          },
        ].map((card) => (
          <div key={card.title}
            className="rounded-xl border border-brand-border bg-brand-surface p-6 space-y-2">
            <span className="text-2xl">{card.icon}</span>
            <h3 className="font-display font-semibold text-brand-text">{card.title}</h3>
            <p className="text-brand-dim text-sm leading-relaxed">{card.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-brand-dim text-xs font-mono uppercase tracking-wider mb-1">{label}</p>
      <p className="text-brand-green font-mono text-xl font-semibold">{value}</p>
    </div>
  );
}
