"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { useState, useEffect, type ReactNode } from "react";
import { wagmiConfig } from "@/config/wagmi";
import { privyConfig } from "@/config/privy";
import "@rainbow-me/rainbowkit/styles.css";

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchInterval: 60 * 1000,
          },
        },
      })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR / static generation, render children without Web3 providers
  // to avoid localStorage / env var errors at build time.
  if (!mounted) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // If Privy is not configured, render without auth providers
  if (!privyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#7c3aed",
              accentColorForeground: "white",
              borderRadius: "medium",
            })}
          >
            {children}
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider appId={privyAppId} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#7c3aed",
              accentColorForeground: "white",
              borderRadius: "medium",
            })}
          >
            {children}
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
