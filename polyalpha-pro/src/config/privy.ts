import type { PrivyClientConfig } from "@privy-io/react-auth";

export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: "dark",
    accentColor: "#7c3aed",
    showWalletLoginFirst: true,
  },
  loginMethods: ["wallet", "google", "github", "twitter"],
  embeddedWallets: {
    ethereum: { createOnLogin: "off" },
  },
};
