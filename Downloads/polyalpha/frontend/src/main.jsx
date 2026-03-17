import React from 'react'
import ReactDOM from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'

// EVM — RainbowKit + Wagmi
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@rainbow-me/rainbowkit/styles.css'
import { wagmiConfig } from './wagmiConfig.js'

// Solana — Wallet Adapter
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'

import AuthGate from './AuthGate.jsx'

const queryClient = new QueryClient()
const solanaNetwork = clusterApiUrl('mainnet-beta')
const solanaWallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new TorusWalletAdapter(),
]

ReactDOM.createRoot(document.getElementById('root')).render(
  <PrivyProvider
    appId="cmmgt6j5d02wz0bldoajtnst9"
    config={{
      appearance: {
        theme: 'dark',
        accentColor: '#ffffff',
      },
      embeddedWallets: { createOnLogin: 'off' },
    }}
  >
    <ConnectionProvider endpoint={solanaNetwork}>
      <WalletProvider wallets={solanaWallets} autoConnect>
        <WalletModalProvider>
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider theme={darkTheme({
                accentColor: '#ffffff',
                accentColorForeground: '#040406',
                borderRadius: 'large',
                fontStack: 'system',
                overlayBlur: 'large',
              })}>
                <AuthGate />
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </PrivyProvider>
)
