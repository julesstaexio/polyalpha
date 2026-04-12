"use client";

import { usePrivy } from "@privy-io/react-auth";

interface AuthState {
  authenticated: boolean;
  login: () => void;
  logout: () => Promise<void> | void;
  user: {
    id?: string;
    google?: { name?: string };
    wallet?: { address?: string };
  } | null;
}

const FALLBACK: AuthState = {
  authenticated: false,
  login: () => {},
  logout: () => {},
  user: null,
};

/**
 * Safe wrapper around usePrivy that returns a fallback
 * when PrivyProvider is not mounted (SSR / build time / missing config).
 */
export function useAuth(): AuthState {
  try {
    const privy = usePrivy();
    return {
      authenticated: privy.authenticated,
      login: privy.login,
      logout: privy.logout,
      user: privy.user
        ? {
            id: privy.user.id,
            google: privy.user.google
              ? { name: privy.user.google.name ?? undefined }
              : undefined,
            wallet: privy.user.wallet
              ? { address: privy.user.wallet.address }
              : undefined,
          }
        : null,
    };
  } catch {
    return FALLBACK;
  }
}
