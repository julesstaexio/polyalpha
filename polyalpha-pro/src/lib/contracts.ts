// Polymarket smart contract addresses and ABIs on Polygon

export const POLYGON_CHAIN_ID = 137;

// ─── Contract Addresses ───

export const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const; // USDC.e on Polygon
export const CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E" as const;
export const NEG_RISK_CTF_EXCHANGE = "0xC5d563A36AE78145C45a50134d48A1215220f80a" as const;
export const CONDITIONAL_TOKENS = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045" as const;

// ─── USDC ABI (minimal: balanceOf, approve, allowance, transfer) ───

export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

// ─── CTF Exchange ABI (deposit / withdraw USDC collateral) ───
// The exchange uses addFunding / removeFunding, but the simplest path
// is through the ERC20 proxy deposit contract which wraps USDC deposit

export const CTF_EXCHANGE_ABI = [
  // Check USDC collateral balance in the exchange
  {
    name: "getBalance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "usr", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Deposit – after USDC approval, moves USDC into exchange as collateral
  {
    name: "depositFunds",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  // Withdraw – pulls USDC collateral back to wallet
  {
    name: "withdrawFunds",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
] as const;

// USDC has 6 decimals on Polygon
export const USDC_DECIMALS = 6;

export function parseUSDC(amount: string | number): bigint {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return BigInt(Math.round(num * 10 ** USDC_DECIMALS));
}

export function formatUSDC(raw: bigint): string {
  const num = Number(raw) / 10 ** USDC_DECIMALS;
  return num.toFixed(2);
}
