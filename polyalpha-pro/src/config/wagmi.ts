"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygon, mainnet, arbitrum, base, optimism } from "wagmi/chains";

// Use a placeholder projectId for builds without env vars (dev/CI).
// WalletConnect will not function without a real ID at runtime.
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: "PolyAlpha Pro",
  projectId,
  chains: [polygon, mainnet, arbitrum, base, optimism],
  ssr: true,
});
