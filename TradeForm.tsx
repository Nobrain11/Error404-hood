/**
 * TradeForm.tsx
 * Buy/Sell swap interface for any Pons (UniswapV2) token.
 * Reads pool data, quotes output, and executes swaps via ethers.js.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "./WalletContext";
import {
  getBuyQuote, getSellQuote, executeBuy, executeSell,
  getPoolData, getTokenBalance, type PoolData,
} from "@/lib/pons";
import { fmtAmount, shortAddr } from "@/lib/utils";
import { ethers } from "ethers";

interface Props {
  tokenAddress: string;
  tokenSymbol:  string;
}

type Tab = "buy" | "sell";

interface TxRecord {
  hash:      string;
  type:      Tab;
  token:     string;
  amount:    string;
  timestamp: string;
  status:    "pending" | "confirmed" | "failed";
}

const TX_KEY = "error404_txs";

function loadTxs(): TxRecord[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(TX_KEY) ?? "[]"); }
  catch { return []; }
}
function saveTx(tx: TxRecord) {
  const prev = loadTxs();
  localStorage.setItem(TX_KEY, JSON.stringify([tx, ...prev].slice(0, 50)));
}

export default function TradeForm({ tokenAddress, tokenSymbol }: Props) {
  const { signer, address, isCorrectChain, connect, switchChain } = useWallet();

  const [tab,        setTab]        = useState<Tab>("buy");
  const [amount,     setAmount]     = useState("");
  const [slippage,   setSlippage]   = useState(0.5);
  const [pool,       setPool]       = useState<PoolData | null>(null);
  const [balance,    setBalance]    = useState("0");
  const [quote,      setQuote]      = useState<{ out: string; impact: string; min: string } | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [quoting,    setQuoting]    = useState(false);
  const [txHash,     setTxHash]     = useState<string | null>(null);
  const [txError,    setTxError]    = useState<string | null>(null);
  const [txHistory,  setTxHistory]  = useState<TxRecord[]>([]);

  // Load pool data
  useEffect(() => {
    if (!tokenAddress) return;
    getPoolData(tokenAddress).then(setPool).catch(console.error);
  }, [tokenAddress]);

  // Load user balance
  useEffect(() => {
    if (!address || !tokenAddress) return;
    getTokenBalance(tokenAddress, address).then(setBalance).catch(() => setBalance("0"));
  }, [address, tokenAddress]);

  // Load tx history
  useEffect(() => { setTxHistory(loadTxs()); }, []);

  // Debounced quoting
  useEffect(() => {
    if (!amount || !tokenAddress || isNaN(Number(amount)) || Number(amount) <= 0) {
      setQuote(null);
      return;
    }
    setQuoting(true);
    const timer = setTimeout(async () => {
      try {
        if (tab === "buy") {
          const q = await getBuyQuote(tokenAddress, amount, slippage);
          setQuote({
            out:    fmtAmount(ethers.formatUnits(q.amountOut, 18)),
            impact: q.priceImpact.toFixed(2),
            min:    fmtAmount(ethers.formatUnits(q.amountOutMin, 18)),
          });
        } else {
          const q = await getSellQuote(tokenAddress, amount, slippage);
          setQuote({
            out:    fmtAmount(ethers.formatEther(q.amountOut)),
            impact: q.priceImpact.toFixed(2),
            min:    fmtAmount(ethers.formatEther(q.amountOutMin)),
          });
        }
      } catch { setQuote(null); }
      finally  { setQuoting(false); }
    }, 500);
    return () => clearTimeout(timer);
  }, [amount, tab, slippage, tokenAddress]);

  const handleSwap = useCallback(async () => {
    if (!signer || !amount) return;
    setLoading(true);
    setTxHash(null);
    setTxError(null);
    try {
      let hash: string;
      if (tab === "buy") {
        hash = await executeBuy(signer, tokenAddress, amount, slippage);
      } else {
        hash = await executeSell(signer, tokenAddress, amount, slippage);
      }
      setTxHash(hash);
      const record: TxRecord = {
        hash, type: tab, token: tokenAddress,
        amount, timestamp: new Date().toISOString(), status: "pending",
      };
      saveTx(record);
      setTxHistory(loadTxs());
      setAmount("");
    } catch (e: unknown) {
      const msg = (e as { reason?: string; message?: string }).reason
               ?? (e as { message?: string }).message
               ?? "Transaction failed";
      setTxError(msg);
    } finally {
      setLoading(false);
    }
  }, [signer, amount, tab, slippage, tokenAddress]);

  const explorerBase = "https://robinhoodchain.blockscout.com/tx/";

  return (
    <div className="space-y-6">
      {/* Pool stats */}
      {pool && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Price" value={`${pool.priceInETH.toExponential(4)} ETH`} />
          <StatCard label="Liquidity" value={`${fmtAmount(pool.liquidityETH)} ETH`} />
        </div>
      )}

      {/* Buy / Sell tabs */}
      <div className="flex rounded-lg overflow-hidden border border-brand-border">
        {(["buy", "sell"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setAmount(""); setQuote(null); }}
            className={`flex-1 py-2.5 font-display font-semibold text-sm uppercase tracking-wide
                        transition-colors ${
                          tab === t
                            ? t === "buy"
                              ? "bg-brand-green text-brand-bg"
                              : "bg-brand-red   text-white"
                            : "bg-brand-surface text-brand-dim hover:text-brand-text"
                        }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-mono text-brand-dim">
          <span>{tab === "buy" ? "ETH to spend" : `${tokenSymbol} to sell`}</span>
          {tab === "sell" && address && (
            <button
              onClick={() => setAmount(balance)}
              className="text-brand-green hover:underline"
            >
              Max: {fmtAmount(balance)}
            </button>
          )}
        </div>
        <input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={tab === "buy" ? "0.01" : "1000"}
          className="w-full px-4 py-3 rounded-lg bg-brand-surface border border-brand-border
                     text-brand-text font-mono text-lg focus:outline-none
                     focus:border-brand-green transition-colors"
        />
      </div>

      {/* Slippage */}
      <div className="flex items-center gap-3 text-xs font-mono text-brand-dim">
        <span>Slippage:</span>
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            onClick={() => setSlippage(s)}
            className={`px-2 py-1 rounded border transition-colors ${
              slippage === s
                ? "border-brand-green text-brand-green"
                : "border-brand-border text-brand-dim hover:border-brand-muted"
            }`}
          >
            {s}%
          </button>
        ))}
        <input
          type="number"
          min="0.1"
          max="50"
          step="0.1"
          value={slippage}
          onChange={(e) => setSlippage(Number(e.target.value))}
          className="w-16 px-2 py-1 rounded border border-brand-border bg-transparent
                     text-brand-text text-xs focus:outline-none focus:border-brand-green"
        />
      </div>

      {/* Quote preview */}
      {quoting && (
        <div className="text-brand-dim font-mono text-xs animate-pulse">Fetching quote…</div>
      )}
      {quote && !quoting && (
        <div className="rounded-lg border border-brand-border bg-brand-surface p-4 space-y-2">
          <QuoteRow label="Expected output" value={`${quote.out} ${tab === "buy" ? tokenSymbol : "ETH"}`} />
          <QuoteRow label="Price impact"    value={`${quote.impact}%`}
            highlight={Number(quote.impact) > 5 ? "red" : Number(quote.impact) > 2 ? "amber" : "green"} />
          <QuoteRow label="Min received"    value={`${quote.min} ${tab === "buy" ? tokenSymbol : "ETH"}`} />
        </div>
      )}

      {/* CTA */}
      {!address ? (
        <button onClick={connect}
          className="w-full py-3 rounded-lg border border-brand-green text-brand-green
                     font-display font-semibold hover:bg-brand-green hover:text-brand-bg transition-all">
          Connect Wallet
        </button>
      ) : !isCorrectChain ? (
        <button onClick={switchChain}
          className="w-full py-3 rounded-lg bg-brand-amber text-brand-bg
                     font-display font-semibold hover:opacity-90 transition-opacity">
          Switch to Robinhood Chain
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={loading || !amount || Number(amount) <= 0}
          className={`w-full py-3 rounded-lg font-display font-semibold text-sm
                      transition-all disabled:opacity-40 ${
                        tab === "buy"
                          ? "bg-brand-green text-brand-bg hover:opacity-90"
                          : "bg-brand-red text-white hover:opacity-90"
                      }`}
        >
          {loading ? "Confirming…" : `${tab === "buy" ? "Buy" : "Sell"} ${tokenSymbol}`}
        </button>
      )}

      {/* TX feedback */}
      {txHash && (
        <div className="rounded-lg border border-brand-green/40 bg-brand-green/5 p-3">
          <p className="text-brand-green text-xs font-mono">
            ✓ TX submitted:{" "}
            <a href={`${explorerBase}${txHash}`} target="_blank" rel="noreferrer"
               className="underline hover:opacity-80">
              {shortAddr(txHash, 6)}
            </a>
          </p>
        </div>
      )}
      {txError && (
        <div className="rounded-lg border border-brand-red/40 bg-brand-red/5 p-3">
          <p className="text-brand-red text-xs font-mono">✗ {txError}</p>
        </div>
      )}

      {/* TX history */}
      {txHistory.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-brand-dim text-xs font-mono uppercase tracking-wider">
            Recent Transactions
          </h3>
          {txHistory.slice(0, 5).map((tx) => (
            <div key={tx.hash}
              className="flex justify-between items-center px-3 py-2 rounded
                         bg-brand-surface border border-brand-border text-xs font-mono">
              <span className={tx.type === "buy" ? "text-brand-green" : "text-brand-red"}>
                {tx.type.toUpperCase()} {tx.amount}
              </span>
              <a href={`${explorerBase}${tx.hash}`} target="_blank" rel="noreferrer"
                 className="text-brand-dim hover:text-brand-text underline">
                {shortAddr(tx.hash)}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-brand-surface border border-brand-border px-4 py-3">
      <p className="text-brand-dim text-xs font-mono uppercase tracking-wider mb-1">{label}</p>
      <p className="text-brand-green font-mono text-sm">{value}</p>
    </div>
  );
}

function QuoteRow({
  label, value, highlight,
}: { label: string; value: string; highlight?: "green" | "amber" | "red" }) {
  const color = highlight === "red" ? "text-brand-red"
              : highlight === "amber" ? "text-brand-amber"
              : highlight === "green" ? "text-brand-green"
              : "text-brand-text";
  return (
    <div className="flex justify-between text-xs font-mono">
      <span className="text-brand-dim">{label}</span>
      <span className={color}>{value}</span>
    </div>
  );
}
