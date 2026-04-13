"use client";

import { useReadContract, useAccount } from "wagmi";
import {
  USDC_ADDRESS,
  CTF_EXCHANGE,
  ERC20_ABI,
  USDC_DECIMALS,
  POLYGON_CHAIN_ID,
} from "@/lib/contracts";

const FALLBACK = {
  address: undefined as `0x${string}` | undefined,
  isConnected: false,
  balance: 0,
  allowance: 0,
  rawBalance: BigInt(0),
  rawAllowance: BigInt(0),
  isLoading: false,
  refetch: () => {},
};

/**
 * Reads the user's USDC wallet balance and their current allowance
 * to the CTF Exchange on Polygon.
 * Returns a safe fallback when WagmiProvider is not available (SSR/build).
 */
export function useWalletBalance() {
  try {
    return useWalletBalanceInner();
  } catch {
    return FALLBACK;
  }
}

function useWalletBalanceInner() {
  const { address, isConnected } = useAccount();

  // USDC balance in wallet
  const {
    data: rawBalance,
    isLoading: balanceLoading,
    refetch: refetchBalance,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: POLYGON_CHAIN_ID,
    query: { enabled: !!address },
  });

  // USDC allowance to CTF Exchange
  const {
    data: rawAllowance,
    isLoading: allowanceLoading,
    refetch: refetchAllowance,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CTF_EXCHANGE] : undefined,
    chainId: POLYGON_CHAIN_ID,
    query: { enabled: !!address },
  });

  const balance = rawBalance
    ? Number(rawBalance) / 10 ** USDC_DECIMALS
    : 0;

  const allowance = rawAllowance
    ? Number(rawAllowance) / 10 ** USDC_DECIMALS
    : 0;

  function refetch() {
    refetchBalance();
    refetchAllowance();
  }

  return {
    address,
    isConnected,
    balance,
    allowance,
    rawBalance: rawBalance ?? BigInt(0),
    rawAllowance: rawAllowance ?? BigInt(0),
    isLoading: balanceLoading || allowanceLoading,
    refetch,
  };
}
