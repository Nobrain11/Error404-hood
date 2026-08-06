/**
 * pons.ts — On-chain data and swap execution for the Telegram bot.
 *
 * Mirrors the web app's lib/pons.ts but runs entirely server-side (Node.js).
 * Uses ethers.js v6 for all blockchain interactions.
 */

import {
  ethers,
  Contract,
  JsonRpcProvider,
  Wallet,
} from "ethers";
import "dotenv/config";

// ─── Config ───────────────────────────────────────────────────────────────────

export const RPC_URL      = process.env.RPC_URL      ?? "https://rpc.mainnet.chain.robinhood.com";
export const FACTORY_ADDR = process.env.FACTORY_ADDRESS ?? "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
export const ROUTER_ADDR  = process.env.ROUTER_ADDRESS  ?? "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
export const WETH_ADDR    = process.env.WETH_ADDRESS    ?? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const BLOCKSCOUT   = process.env.BLOCKSCOUT_URL  ?? "https://robinhoodchain.blockscout.com/api/v2";

// UniswapV2 CREATE2 init code hash
const INIT_CODE_HASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";

// ─── Minimal ABIs ─────────────────────────────────────────────────────────────

const PAIR_ABI = [
  "function getReserves() view returns (uint112 r0, uint112 r1, uint32 ts)",
  "function token0() view returns (address)",
];

const FACTORY_ABI = [
  "function getPair(address a, address b) view returns (address pair)",
];

const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory)",
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory)",
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

// ─── Provider (singleton) ─────────────────────────────────────────────────────

let _provider: JsonRpcProvider | null = null;
export function getProvider(): JsonRpcProvider {
  if (!_provider) {
    _provider = new JsonRpcProvider(RPC_URL, { chainId: 4663, name: "robinhood" });
  }
  return _provider;
}

// ─── Pair address ─────────────────────────────────────────────────────────────

export function computePairAddress(tokenA: string, tokenB: string): string {
  const [t0, t1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  const salt = ethers.keccak256(
    ethers.concat([ethers.zeroPadValue(t0, 32), ethers.zeroPadValue(t1, 32)])
  );
  return ethers.getCreate2Address(FACTORY_ADDR, salt, INIT_CODE_HASH);
}

async function getPairAddress(tokenAddr: string): Promise<string> {
  try {
    const factory = new Contract(FACTORY_ADDR, FACTORY_ABI, getProvider());
    const pair    = await factory.getPair(tokenAddr, WETH_ADDR) as string;
    if (pair && pair !== ethers.ZeroAddress) return pair;
  } catch { /* fall through */ }
  return computePairAddress(tokenAddr, WETH_ADDR);
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export interface TokenPrice {
  priceInETH:   number;
  liquidityETH: number;
  pairAddress:  string;
}

/**
 * Get live token price from pool reserves.
 * price = wethReserve / tokenReserve
 */
export async function getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
  const pairAddress = await getPairAddress(tokenAddress);
  const pair        = new Contract(pairAddress, PAIR_ABI, getProvider());
  const [token0, [r0, r1]] = await Promise.all([
    pair.token0() as Promise<string>,
    pair.getReserves() as Promise<[bigint, bigint, number]>,
  ]);
  const isToken0   = token0.toLowerCase() === tokenAddress.toLowerCase();
  const tokenRes   = isToken0 ? r0 : r1;
  const wethRes    = isToken0 ? r1 : r0;
  const priceInETH = Number(ethers.formatEther(wethRes)) / Number(ethers.formatUnits(tokenRes, 18));
  return {
    priceInETH,
    liquidityETH: Number(ethers.formatEther(wethRes)) * 2,
    pairAddress,
  };
}

/**
 * Get user's token balance.
 */
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string
): Promise<string> {
  const token   = new Contract(tokenAddress, ERC20_ABI, getProvider());
  const balance = await token.balanceOf(walletAddress) as bigint;
  return ethers.formatUnits(balance, 18);
}

/**
 * Check if token source code is verified on Blockscout.
 */
export async function getVerificationStatus(tokenAddress: string): Promise<boolean> {
  try {
    const res  = await fetch(`${BLOCKSCOUT}/tokens/${tokenAddress}`);
    if (!res.ok) return false;
    const data = await res.json() as { has_verified_source_code?: boolean };
    return data.has_verified_source_code ?? false;
  } catch {
    return false;
  }
}

// ─── Swap execution ───────────────────────────────────────────────────────────

/**
 * Execute a buy or sell swap using a private key.
 *
 * @param type         "buy" (ETH → TOKEN) or "sell" (TOKEN → ETH)
 * @param tokenAddress Target token contract address
 * @param amount       ETH amount (buy) or token amount (sell) as string
 * @param privateKey   User's wallet private key (decrypted from store)
 * @param slippage     Slippage tolerance in percent (default 1)
 * @returns            Transaction hash
 */
export async function executeSwap(
  type:         "buy" | "sell",
  tokenAddress: string,
  amount:       string,
  privateKey:   string,
  slippage:     number = 1
): Promise<string> {
  // Build signer from private key
  const wallet = new Wallet(privateKey, getProvider());
  const router = new Contract(ROUTER_ADDR, ROUTER_ABI, wallet);

  const deadline   = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min
  const slippageBps = BigInt(Math.floor(slippage * 100));

  if (type === "buy") {
    // ETH → TOKEN
    const amountIn  = ethers.parseEther(amount);
    const path      = [WETH_ADDR, tokenAddress];
    const amounts   = await router.getAmountsOut(amountIn, path) as bigint[];
    const amountOut = amounts[1];
    const minOut    = (amountOut * (10000n - slippageBps)) / 10000n;

    const tx = await router.swapExactETHForTokens(
      minOut, path, wallet.address, deadline,
      { value: amountIn }
    ) as { hash: string };
    return tx.hash;
  } else {
    // TOKEN → ETH
    const token     = new Contract(tokenAddress, ERC20_ABI, wallet);
    const amountIn  = ethers.parseUnits(amount, 18);
    const path      = [tokenAddress, WETH_ADDR];

    // Approve if needed
    const allowance = await token.allowance(wallet.address, ROUTER_ADDR) as bigint;
    if (allowance < amountIn) {
      const approveTx = await token.approve(ROUTER_ADDR, ethers.MaxUint256) as { wait: () => Promise<unknown> };
      await approveTx.wait();
    }

    const amounts   = await router.getAmountsOut(amountIn, path) as bigint[];
    const amountOut = amounts[1];
    const minOut    = (amountOut * (10000n - slippageBps)) / 10000n;

    const tx = await router.swapExactTokensForETH(
      amountIn, minOut, path, wallet.address, deadline
    ) as { hash: string };
    return tx.hash;
  }
}
