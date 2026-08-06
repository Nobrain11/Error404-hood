/**
 * TokenFeed.tsx
 * Live-updating table of tokens created by the Pons factory.
 * Polls /api/tokens every 15 seconds via SWR.
 */

"use client";

import { useRouter } from "next/navigation";
import { useState }  from "react";
import useSWR        from "swr";
import { timeAgo, isAddress } from "@/lib/utils";
import type { TokenRow } from "@/app/api/tokens/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function TokenFeed() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");

  // Poll every 15 seconds
  const { data: tokens, isLoading, error } = useSWR<TokenRow[]>(
    "/api/tokens",
    fetcher,
    { refreshInterval: 15_000, revalidateOnFocus: false }
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const addr = search.trim();
    if (!isAddress(addr)) {
      setSearchError("Enter a valid 0x… token address.");
      return;
    }
    setSearchError("");
    router.push(`/trade?token=${addr}`);
  }

  return (
    <section className="w-full">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSearchError(""); }}
          placeholder="Search by token address (0x…)"
          className="flex-1 px-4 py-2.5 rounded-lg bg-brand-surface border border-brand-border
                     text-brand-text font-mono text-sm placeholder:text-brand-muted
                     focus:outline-none focus:border-brand-green transition-colors"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-lg bg-brand-green text-brand-bg font-display
                     font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Trade →
        </button>
      </form>
      {searchError && (
        <p className="text-brand-red text-xs font-mono mb-4">{searchError}</p>
      )}

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-2 px-4 py-2
                      text-brand-dim text-xs font-mono uppercase tracking-wider
                      border-b border-brand-border">
        <span>Token</span>
        <span>Symbol</span>
        <span>Age</span>
        <span>Holders</span>
        <span className="text-right">Verified</span>
      </div>

      {/* Rows */}
      {isLoading && (
        <div className="py-12 text-center text-brand-dim font-mono text-sm">
          Loading tokens…
        </div>
      )}
      {error && (
        <div className="py-12 text-center text-brand-red font-mono text-sm">
          Failed to load token feed.
        </div>
      )}
      {tokens?.map((token) => (
        <TokenRow key={token.address} token={token} />
      ))}
      {tokens?.length === 0 && !isLoading && (
        <div className="py-12 text-center text-brand-dim font-mono text-sm">
          No tokens found yet.
        </div>
      )}
    </section>
  );
}

function TokenRow({ token }: { token: TokenRow }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/trade?token=${token.address}`)}
      className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-2 px-4 py-3
                 border-b border-brand-border/50 cursor-pointer
                 hover:bg-brand-surface transition-colors animate-fade-in
                 group"
    >
      <span className="font-display font-medium text-brand-text text-sm truncate
                       group-hover:text-brand-green transition-colors">
        {token.name}
      </span>
      <span className="font-mono text-brand-green text-sm">${token.symbol}</span>
      <span className="font-mono text-brand-dim text-xs self-center">
        {timeAgo(token.timestamp)}
      </span>
      <span className="font-mono text-brand-dim text-xs self-center">
        {Number(token.holders).toLocaleString()}
      </span>
      <span className="text-right self-center">
        {token.verified ? (
          <span title="Source verified" className="text-brand-green text-sm">✓</span>
        ) : (
          <span title="Unverified" className="text-brand-amber text-sm">⚠</span>
        )}
      </span>
    </div>
  );
}
