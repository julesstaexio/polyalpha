import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import App from './App.jsx'
import LoginPage from './LoginPage.jsx'

export default function AuthGate() {
  const { ready, authenticated } = usePrivy()
  const { isConnected: isEVMConnected } = useAccount()
  const { connected: isSolanaConnected } = useWallet()
  const [splashDone, setSplashDone] = useState(false)

  if (!ready) return (
    <div style={{
      minHeight:'100vh', background:'#040406',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <div style={{
        width:32, height:32,
        border:'2px solid rgba(255,255,255,0.06)',
        borderTop:'2px solid rgba(255,255,255,0.4)',
        borderRadius:'50%',
        animation:'spin 0.8s linear infinite',
      }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const isLoggedIn = authenticated || isEVMConnected || isSolanaConnected
  const stayConnected = localStorage.getItem('polyalpha_stay_connected') !== 'false'

  // If logged in AND stay connected → skip splash, go straight to dashboard
  if (isLoggedIn && stayConnected) return <App />

  // Otherwise always show splash first
  if (!splashDone) return (
    <LoginPage
      onEnter={() => setSplashDone(true)}
      splashOnly={isLoggedIn}
    />
  )

  if (isLoggedIn) return <App />
  return <LoginPage onEnter={() => setSplashDone(true)} splashDone />
}
