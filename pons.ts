/**
 * pons.ts — On-chain interactions with Pons (UniswapV2-fork) pools.
 *
 * Architecture:
 *  - Every Pons token has a UniswapV2 pair: TOKEN/WETH
 *  - Pair address is computed via CREATE2 (UniswapV2 formula)
 *  - Price = WETH reserve / TOKEN reserve (normalised for decimals)
 */

import { ethers, Contract, JsonRpcProvider, BrowserProvider, Signer } from "ethers";

// ─── Constants ────────────────────────────────────────────────────────────────

export const RPC_URL      = process.env.NEXT_PUBLIC_RPC_URL      ?? "https://rpc.mainnet.chain.robinhood.com";
export const FACTORY_ADDR = process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
export const ROUTER_ADDR  = process.env.NEXT_PUBLIC_ROUTER_ADDRESS  ?? "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
export const WETH_ADDR    = process.env.NEXT_PUBLIC_WETH_ADDRESS    ?? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

// UniswapV2 init code hash (standard deployment)
const INIT_CODE_HASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";

// ─── Minimal ABIs ─────────────────────────────────────────────────────────────

const PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function totalSupply() view returns (uint256)",
];

const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address pair)",
];

const ROUTER_ABI = [
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// ─── Provider ─────────────────────────────────────────────────────────────────

let _provider: JsonRpcProvider | null = null;

export function getProvider(): JsonRpcProvider {
  if (!_provider) {
    _provider = new JsonRpcProvider(RPC_URL, {
      chainId: 4663,
      name:    "robinhood",
    });
  }
  return _provider;
}

// ─── Pair address computation ─────────────────────────────────────────────────

/**
 * Compute UniswapV2 pair address deterministically via CREATE2.
 * Matches the on-chain address without an RPC call.
 */
export function computePairAddress(tokenA: string, tokenB: string): string {
  // Sort tokens (UniswapV2 sorts by address value)
  const [token0, token1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  const salt = ethers.keccak256(
    ethers.concat([
      ethers.zeroPadValue(token0, 32),
      ethers.zeroPadValue(token1, 32),
    ])
  );

  return ethers.getCreate2Address(FACTORY_ADDR, salt, INIT_CODE_HASH);
}

/** Fetch pair address from factory contract (falls back to CREATE2 calc) */
export async function getPairAddress(tokenAddress: string): Promise<string> {
  try {
    const factory = new Contract(FACTORY_ADDR, FACTORY_ABI, getProvider());
    const pair = await factory.getPair(tokenAddress, WETH_ADDR);
    if (pair && pair !== ethers.ZeroAddress) return pair;
  } catch {
    // fall through to CREATE2
  }
  return computePairAddress(tokenAddress, WETH_ADDR);
}

// ─── Price & Liquidity ────────────────────────────────────────────────────────

export interface PoolData {
  pairAddress:   string;
  token0:        string;
  reserve0:      bigint;
  reserve1:      bigint;
  priceInETH:    number;   // TOKEN price denominated in ETH
  liquidityETH:  number;   // Total liquidity in ETH
}

/** Fetch live pool reserves and derive token price */
export async function getPoolData(tokenAddress: string): Promise<PoolData> {
  const pairAddress = await getPairAddress(tokenAddress);
  const pair        = new Contract(pairAddress, PAIR_ABI, getProvider());

  const [token0, [reserve0, reserve1]] = await Promise.all([
    pair.token0(),
    pair.getReserves(),
  ]);

  // Determine which reserve corresponds to which token
  const tokenIsToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();
  const tokenReserve  = tokenIsToken0 ? reserve0 : reserve1;
  const wethReserve   = tokenIsToken0 ? reserve1 : reserve0;

  // price = WETH reserve / TOKEN reserve
  const priceInETH =
    Number(ethers.formatEther(wethReserve)) /
    Number(ethers.formatUnits(tokenReserve, 18));

  const liquidityETH = Number(ethers.formatEther(wethReserve)) * 2;

  return {
    pairAddress,
    token0,
    reserve0,
    reserve1,
    priceInETH,
    liquidityETH,
  };
}

// ─── Swap quoting ─────────────────────────────────────────────────────────────

export interface SwapQuote {
  amountIn:       bigint;
  amountOut:      bigint;
  amountOutMin:   bigint;   // after slippage
  priceImpact:    number;   // 0–100 %
  path:           string[];
}

/**
 * Get a buy quote: ETH → TOKEN.
 * @param amountInEth  Amount of ETH to spend (as a string, e.g. "0.1")
 * @param slippage     Slippage tolerance in percent (e.g. 0.5)
 */
export async function getBuyQuote(
  tokenAddress: string,
  amountInEth:  string,
  slippage:     number = 0.5
): Promise<SwapQuote> {
  const router     = new Contract(ROUTER_ADDR, ROUTER_ABI, getProvider());
  const path       = [WETH_ADDR, tokenAddress];
  const amountIn   = ethers.parseEther(amountInEth);
  const amounts    = await router.getAmountsOut(amountIn, path);
  const amountOut  = amounts[1] as bigint;

  const slippageBps = BigInt(Math.floor(slippage * 100));
  const amountOutMin =
    (amountOut * (10000n - slippageBps)) / 10000n;

  // Price impact: compare spot price vs execution price
  const pool = await getPoolData(tokenAddress);
  const spotOut = Number(amountInEth) / pool.priceInETH;
  const priceImpact = Math.abs(
    (spotOut - Number(ethers.formatUnits(amountOut, 18))) / spotOut
  ) * 100;

  return { amountIn, amountOut, amountOutMin, priceImpact, path };
}

/**
 * Get a sell quote: TOKEN → ETH.
 * @param amountInTokens  Amount of tokens to sell (as a string)
 */
export async function getSellQuote(
  tokenAddress:   string,
  amountInTokens: string,
  slippage:       number = 0.5
): Promise<SwapQuote> {
  const router    = new Contract(ROUTER_ADDR, ROUTER_ABI, getProvider());
  const path      = [tokenAddress, WETH_ADDR];
  const amountIn  = ethers.parseUnits(amountInTokens, 18);
  const amounts   = await router.getAmountsOut(amountIn, path);
  const amountOut = amounts[1] as bigint;

  const slippageBps  = BigInt(Math.floor(slippage * 100));
  const amountOutMin = (amountOut * (10000n - slippageBps)) / 10000n;

  const pool = await getPoolData(tokenAddress);
  const spotOut = Number(amountInTokens) * pool.priceInETH;
  const priceImpact = Math.abs(
    (spotOut - Number(ethers.formatEther(amountOut))) / spotOut
  ) * 100;

  return { amountIn, amountOut, amountOutMin, priceImpact, path };
}

// ─── Swap execution ───────────────────────────────────────────────────────────

/**
 * Execute a buy swap (ETH → TOKEN) using the connected wallet.
 */
export async function executeBuy(
  signer:       Signer,
  tokenAddress: string,
  amountInEth:  string,
  slippage:     number = 0.5
): Promise<string> {
  const router   = new Contract(ROUTER_ADDR, ROUTER_ABI, signer);
  const quote    = await getBuyQuote(tokenAddress, amountInEth, slippage);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 min

  const tx = await router.swapExactETHForTokens(
    quote.amountOutMin,
    quote.path,
    await signer.getAddress(),
    deadline,
    { value: quote.amountIn }
  );
  return tx.hash;
}

/**
 * Execute a sell swap (TOKEN → ETH) using the connected wallet.
 * Handles ERC20 approval if needed.
 */
export async function executeSell(
  signer:         Signer,
  tokenAddress:   string,
  amountInTokens: string,
  slippage:       number = 0.5
): Promise<string> {
  const router     = new Contract(ROUTER_ADDR, ROUTER_ABI, signer);
  const token      = new Contract(tokenAddress, ERC20_ABI, signer);
  const quote      = await getSellQuote(tokenAddress, amountInTokens, slippage);
  const deadline   = BigInt(Math.floor(Date.now() / 1000) + 300);
  const userAddr   = await signer.getAddress();

  // Check and grant approval if needed
  const allowance = await token.allowance(userAddr, ROUTER_ADDR) as bigint;
  if (allowance < quote.amountIn) {
    const approveTx = await token.approve(ROUTER_ADDR, ethers.MaxUint256);
    await approveTx.wait();
  }

  const tx = await router.swapExactTokensForETH(
    quote.amountIn,
    quote.amountOutMin,
    quote.path,
    userAddr,
    deadline
  );
  return tx.hash;
}

/** Fetch user's token balance */
export async function getTokenBalance(
  tokenAddress: string,
  userAddress:  string
): Promise<string> {
  const token   = new Contract(tokenAddress, ERC20_ABI, getProvider());
  const balance = await token.balanceOf(userAddress) as bigint;
  return ethers.formatUnits(balance, 18);
}
