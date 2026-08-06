/**
 * Trading Terminal — /trade?token=0x...
 * Swap interface for any Pons UniswapV2 token on Robinhood Chain.
 */

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { fetchToken, type BSToken } from "@/lib/blockscout";
import { getPoolData, type PoolData } from "@/lib/pons";
import TradeForm from "@/components/TradeForm";
import { shortAddr, fmtAmount, timeAgo } from "@/lib/utils";

const DEFAULT_TOKEN =
  process.env.NEXT_PUBLIC_ERROR404_TOKEN ??
  "0x0000000000000000000000000000000000000404";

const BLOCKSCOUT_BASE = "https://robinhoodchain.blockscout.com";

function TradePage() {
  const params       = useSearchParams();
  const tokenAddress = params.get("token") ?? DEFAULT_TOKEN;

  const [token, setToken] = useState<BSToken | null>(null);
  const [pool,  setPool]  = useState<PoolData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchToken(tokenAddress),
      getPoolData(tokenAddress),
    ])
      .then(([t, p]) => { setToken(t); setPool(p); })
      .catch(() => setError("Token not found or no liquidity pool."))
      .finally(() => setLoading(false));
  }, [tokenAddress]);

  // Refresh pool every 20 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      getPoolData(tokenAddress).then(setPool).catch(() => {});
    }, 20_000);
    return () => clearInterval(iv);
  }, [tokenAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-brand-dim font-mono animate-pulse">Loading token…</div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="rounded-xl border border-brand-red/30 bg-brand-red/5 p-8 text-center">
        <p className="text-brand-red font-mono">{error ?? "Unknown error"}</p>
        <p className="text-brand-dim text-sm mt-2">
          Make sure the address is a valid Pons token on Robinhood Chain.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Token header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-3xl text-brand-text">{token.name}</h1>
            <span className="px-2 py-0.5 rounded bg-brand-surface border border-brand-border
                             text-brand-green font-mono text-sm">
              ${token.symbol}
            </span>
            {token.has_verified_source_code ? (
              <span title="Source verified" className="text-brand-green text-sm">✓ Verified</span>
            ) : (
              <span title="Unverified source" className="text-brand-amber text-sm">⚠ Unverified</span>
            )}
          </div>
          <p className="text-brand-dim font-mono text-sm mt-1">
            <a
              href={`${BLOCKSCOUT_BASE}/address/${tokenAddress}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-text transition-colors underline"
            >
              {shortAddr(tokenAddress, 8)}
            </a>
          </p>
        </div>
        {pool && (
          <div className="text-right">
            <p className="text-brand-green font-mono text-2xl font-semibold">
              {pool.priceInETH.toExponential(4)} ETH
            </p>
            <p className="text-brand-dim font-mono text-xs mt-0.5">
              Liq: {fmtAmount(pool.liquidityETH)} ETH
            </p>
          </div>
        )}
      </div>

      {/* DEXScreener chart embed */}
      <div className="rounded-xl border border-brand-border overflow-hidden bg-brand-surface">
        <div className="px-4 py-2 border-b border-brand-border">
          <span className="text-brand-dim text-xs font-mono uppercase tracking-wider">
            Price Chart
          </span>
        </div>
        <iframe
          src={`https://dexscreener.com/robinhoodchain/${pool?.pairAddress ?? tokenAddress}?embed=1&theme=dark&info=0`}
          className="w-full h-72 border-0"
          title="DEXScreener chart"
        />
      </div>

      {/* Layout: trade form + token details */}
      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Token details */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-brand-text">Token Details</h2>
          <div className="rounded-xl border border-brand-border bg-brand-surface p-5 space-y-3">
            <DetailRow label="Address"      value={shortAddr(tokenAddress, 10)}
              link={`${BLOCKSCOUT_BASE}/address/${tokenAddress}`} />
            <DetailRow label="Total Supply" value={fmtAmount(
              (Number(token.total_supply) / 1e18).toString()
            )} />
            <DetailRow label="Holders"      value={Number(token.holders).toLocaleString()} />
            {pool && (
              <DetailRow label="Pair Address" value={shortAddr(pool.pairAddress, 8)}
                link={`${BLOCKSCOUT_BASE}/address/${pool.pairAddress}`} />
            )}
          </div>
        </div>

        {/* Trade form */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h2 className="font-display font-semibold text-brand-text mb-5">Swap</h2>
          <TradeForm tokenAddress={tokenAddress} tokenSymbol={token.symbol} />
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label, value, link,
}: { label: string; value: string; link?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-brand-dim font-mono">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer"
           className="text-brand-text font-mono hover:text-brand-green underline transition-colors">
          {value}
        </a>
      ) : (
        <span className="text-brand-text font-mono">{value}</span>
      )}
    </div>
  );
}

export default function TradePageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-64">
        <div className="text-brand-dim font-mono animate-pulse">Loading…</div>
      </div>
    }>
      <TradePage />
    </Suspense>
  );
}
