/**
 * API Route: /api/tokens
 *
 * Server-side proxy for Blockscout data to avoid browser CORS restrictions.
 * Fetches the latest tokens created by the Pons factory contract,
 * enriches them with token metadata, and returns a unified JSON array.
 */

import { NextRequest, NextResponse } from "next/server";

const BLOCKSCOUT = "https://robinhoodchain.blockscout.com/api/v2";
const FACTORY    = process.env.NEXT_PUBLIC_FACTORY_ADDRESS
                   ?? "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

// Cache results for 12 seconds (between the 15-second client poll interval)
export const revalidate = 12;

interface InternalTx {
  type:              string;
  created_contract?: { hash: string };
  timestamp:         string;
}

interface TokenMeta {
  name:                       string;
  symbol:                     string;
  address:                    string;
  has_verified_source_code:   boolean;
  total_supply:               string;
  holders:                    string;
  exchange_rate:               string | null;
}

export interface TokenRow {
  address:    string;
  name:       string;
  symbol:     string;
  timestamp:  string;
  verified:   boolean;
  holders:    string;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch internal transactions from the factory (contract creations)
    const itxRes = await fetch(
      `${BLOCKSCOUT}/addresses/${FACTORY}/internal-transactions?limit=50`,
      { next: { revalidate: 12 } }
    );

    if (!itxRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch factory transactions" },
        { status: 502 }
      );
    }

    const itxData: { items: InternalTx[] } = await itxRes.json();

    // Filter to contract-creation events only
    const creations = (itxData.items ?? []).filter(
      (tx) => tx.type === "create" && tx.created_contract?.hash
    );

    // 2. For each created contract, fetch token metadata in parallel
    const tokenPromises = creations.slice(0, 30).map(async (tx) => {
      const addr = tx.created_contract!.hash;
      try {
        const tokenRes = await fetch(`${BLOCKSCOUT}/tokens/${addr}`, {
          next: { revalidate: 12 },
        });
        if (!tokenRes.ok) return null;
        const meta: TokenMeta = await tokenRes.json();
        return {
          address:   addr,
          name:      meta.name    ?? "Unknown",
          symbol:    meta.symbol  ?? "???",
          timestamp: tx.timestamp,
          verified:  meta.has_verified_source_code ?? false,
          holders:   meta.holders ?? "0",
        } satisfies TokenRow;
      } catch {
        return null;
      }
    });

    const results = (await Promise.all(tokenPromises)).filter(
      (t): t is TokenRow => t !== null
    );

    return NextResponse.json(results, {
      headers: { "Cache-Control": "s-maxage=12, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("[/api/tokens]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
