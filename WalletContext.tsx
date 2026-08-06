/**
 * WalletContext.tsx
 * Global wallet state using React Context + ethers.js v6.
 * Handles: connect, disconnect, network switching to Robinhood Chain (4663).
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { BrowserProvider, Signer } from "ethers";
import { ROBINHOOD_CHAIN_PARAMS } from "@/lib/utils";

interface WalletState {
  address:   string | null;
  signer:    Signer | null;
  chainId:   number | null;
  isCorrectChain: boolean;
  connecting: boolean;
  connect:    () => Promise<void>;
  disconnect: () => void;
  switchChain: () => Promise<void>;
}

const WalletContext = createContext<WalletState>({
  address: null, signer: null, chainId: null,
  isCorrectChain: false, connecting: false,
  connect: async () => {}, disconnect: () => {}, switchChain: async () => {},
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address,   setAddress]   = useState<string | null>(null);
  const [signer,    setSigner]    = useState<Signer | null>(null);
  const [chainId,   setChainId]   = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  const isCorrectChain = chainId === 4663;

  const connect = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask to use this feature.");
      return;
    }
    setConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const s    = await provider.getSigner();
      const addr = await s.getAddress();
      const net  = await provider.getNetwork();
      setSigner(s);
      setAddress(addr);
      setChainId(Number(net.chainId));
    } catch (e) {
      console.error("Wallet connect error:", e);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setSigner(null);
    setAddress(null);
    setChainId(null);
  }, []);

  const switchChain = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ROBINHOOD_CHAIN_PARAMS.chainId }],
      });
    } catch (err: unknown) {
      // Chain not added yet — add it
      if ((err as { code?: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [ROBINHOOD_CHAIN_PARAMS],
        });
      }
    }
  }, []);

  // Listen for account / chain changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;
    const onAccounts = (accounts: string[]) => {
      if (accounts.length === 0) disconnect();
      else setAddress(accounts[0]);
    };
    const onChain = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
    };
    window.ethereum.on("accountsChanged", onAccounts);
    window.ethereum.on("chainChanged",    onChain);
    return () => {
      window.ethereum?.removeListener("accountsChanged", onAccounts);
      window.ethereum?.removeListener("chainChanged",    onChain);
    };
  }, [disconnect]);

  return (
    <WalletContext.Provider
      value={{ address, signer, chainId, isCorrectChain, connecting, connect, disconnect, switchChain }}
    >
      {children}
    </WalletContext.Provider>
  );
}
