import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName:   'Polyalpha',
  projectId: '40d3de63af7bfe3e176ece9262e38e3e',
  chains:    [mainnet, polygon, optimism, arbitrum, base],
  ssr:       false,
})
