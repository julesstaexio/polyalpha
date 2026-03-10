import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'
import { supabase } from './supabaseClient.js'
import App from './App.jsx'
import LoginPage from './LoginPage.jsx'

export default function AuthGate() {
  const [session, setSession] = useState(undefined)
  const { isConnected: isEVMConnected } = useAccount()
  const { connected: isSolanaConnected } = useWallet()

  useEffect(() => {
    const init = async () => {
      if (window.location.hash && window.location.hash.includes('access_token')) {
        const params = new URLSearchParams(window.location.hash.slice(1))
        const access_token  = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (!error && data.session) {
            setSession(data.session)
            window.history.replaceState(null, '', window.location.pathname)
            return
          }
        }
      }
      const { data } = await supabase.auth.getSession()
      setSession(data.session ?? null)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') setSession(s)
      if (event === 'SIGNED_OUT') setSession(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return (
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

  if (session || isEVMConnected || isSolanaConnected) return <App />
  return <LoginPage />
}
