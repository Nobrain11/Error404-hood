/**
 * blockscout.ts — Blockscout API client for Robinhood Chain.
 *
 * All fetch calls go through the Next.js /blockscout proxy rewrite
 * (see next.config.js) to avoid browser CORS errors.
 */

const BASE = "/blockscout"; // proxied in next.config.js

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BSToken {
  address:           string;
  name:              string;
  symbol:            string;
  decimals:          string;
  total_supply:      string;
  holders:           string;
  exchange_rate:     string | null;
  volume_24h:        string | null;
  is_verified_via_admin_panel: boolean;
  has_verified_source_code:    boolean;
}

export interface BSTransaction {
  hash:           string;
  timestamp:      string;
  from:           { hash: string };
  to:             { hash: string } | null;
  created_contract?: { hash: string };
  status:         string;
  value:          string;
}

export interface BSTokenHolder {
  address: { hash: string };
  value:   string;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function bsFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    next: { revalidate: 10 }, // ISR-compatible caching
  });
  if (!res.ok) throw new Error(`Blockscout ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

/** Fetch a single token's metadata */
export async function fetchToken(address: string): Promise<BSToken> {
  return bsFetch<BSToken>(`/tokens/${address}`);
}

/**
 * Fetch recent transactions for a contract address.
 * Used to enumerate tokens created by the Pons factory.
 */
export async function fetchAddressTxs(
  address: string,
  limit = 50
): Promise<BSTransaction[]> {
  const data = await bsFetch<{ items: BSTransaction[] }>(
    `/addresses/${address}/transactions?limit=${limit}&filter=to`
  );
  return data.items ?? [];
}

/**
 * Fetch internal transactions for an address.
 * Contract creation events appear here as type "create".
 */
export async function fetchInternalTxs(
  address: string,
  limit = 50
): Promise<{ items: Array<{ type: string; created_contract?: { hash: string }; timestamp: string }> }> {
  return bsFetch(
    `/addresses/${address}/internal-transactions?limit=${limit}`
  );
}

/**
 * Fetch the list of tokens created by the factory by inspecting
 * internal transactions (contract creations).
 */
export async function fetchFactoryTokens(
  factoryAddress: string
): Promise<Array<{ address: string; timestamp: string }>> {
  const data = await fetchInternalTxs(factoryAddress, 100);
  return (data.items ?? [])
    .filter((tx) => tx.type === "create" && tx.created_contract?.hash)
    .map((tx) => ({
      address:   tx.created_contract!.hash,
      timestamp: tx.timestamp,
    }));
}

/** Check whether a contract's source code is verified on Blockscout */
export async function fetchVerificationStatus(
  address: string
): Promise<boolean> {
  try {
    const token = await fetchToken(address);
    return token.has_verified_source_code ?? false;
  } catch {
    return false;
  }
}

/** Fetch token holders list (used to find the LP pair address) */
export async function fetchTokenHolders(
  address: string
): Promise<BSTokenHolder[]> {
  const data = await bsFetch<{ items: BSTokenHolder[] }>(
    `/tokens/${address}/holders?limit=20`
  );
  return data.items ?? [];
}
