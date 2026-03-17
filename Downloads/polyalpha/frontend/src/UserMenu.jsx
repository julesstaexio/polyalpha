import { useState, useEffect, useRef } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, useDisconnect } from 'wagmi'
import { useWallet } from '@solana/wallet-adapter-react'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const [stayConnected, setStayConnected] = useState(
    () => localStorage.getItem('polyalpha_stay_connected') !== 'false'
  )

  const toggleStayConnected = () => {
    const next = !stayConnected
    setStayConnected(next)
    localStorage.setItem('polyalpha_stay_connected', String(next))
  }
  const ref = useRef(null)

  // Privy
  const { authenticated, user, logout: privyLogout } = usePrivy()

  // EVM
  const { address: evmAddress, isConnected: isEVMConnected } = useAccount()
  const { disconnect: disconnectEVM } = useDisconnect()

  // Solana
  const { publicKey, connected: isSolanaConnected, disconnect: disconnectSolana, wallet } = useWallet()
  const solAddress = publicKey?.toBase58()

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const logout = async () => {
    setOpen(false)
    if (authenticated) await privyLogout()
    if (isEVMConnected) disconnectEVM()
    if (isSolanaConnected) disconnectSolana()
  }

  const isWallet = !authenticated && (isEVMConnected || isSolanaConnected)
  const address  = evmAddress || solAddress
  const shortAddr = address ? `${address.slice(0,6)}…${address.slice(-4)}` : null
  const chain    = isEVMConnected ? 'EVM' : isSolanaConnected ? 'SOL' : null
  const walletName = wallet?.adapter?.name

  // Get user info from Privy
  const privyEmail   = user?.email?.address
  const privyName    = user?.google?.name || user?.github?.username || user?.twitter?.username || privyEmail?.split('@')[0]
  const privyAvatar  = user?.google?.profilePictureUrl || user?.github?.avatarUrl || null

  const name   = authenticated ? (privyName || 'User') : (walletName || shortAddr || 'Wallet')
  const avatar = authenticated ? privyAvatar : null
  const email  = authenticated ? privyEmail : null

  if (!authenticated && !isEVMConnected && !isSolanaConnected) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 100, padding: '5px 10px 5px 6px',
        cursor: 'pointer', transition: 'all .18s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      >
        {avatar
          ? <img src={avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
          : <div style={{ width: 22, height: 22, borderRadius: '50%', background: isWallet ? 'rgba(255,217,122,0.12)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: isWallet ? 'rgba(255,217,122,0.7)' : 'rgba(255,255,255,0.5)', border: isWallet ? '1px solid rgba(255,217,122,0.2)' : 'none' }}>
            {isWallet ? '◎' : (name || '?')[0].toUpperCase()}
          </div>
        }
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 400, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
        {chain && <span style={{ fontSize: 8, color: chain === 'SOL' ? 'rgba(127,255,212,0.7)' : 'rgba(168,196,255,0.7)', background: chain === 'SOL' ? 'rgba(127,255,212,0.08)' : 'rgba(168,196,255,0.08)', border: `1px solid ${chain === 'SOL' ? 'rgba(127,255,212,0.2)' : 'rgba(168,196,255,0.2)'}`, borderRadius: 100, padding: '1px 6px' }}>{chain}</span>}
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 210,
          background: '#0c0c14', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, overflow: 'hidden', zIndex: 500,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          animation: 'fdIn .15s ease',
        }}>
          <style>{`@keyframes fdIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {isWallet && <div style={{ fontSize: 8, color: 'rgba(255,217,122,0.7)', background: 'rgba(255,217,122,0.08)', border: '1px solid rgba(255,217,122,0.15)', borderRadius: 100, padding: '2px 7px', display: 'inline-block', marginBottom: 6, fontWeight: 600, letterSpacing: .5 }}>{chain === 'SOL' ? 'SOLANA' : 'EVM'} WALLET</div>}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500, marginBottom: 2 }}>{name}</div>
            {shortAddr && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{shortAddr}</div>}
            {email && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{email}</div>}
          </div>
          <div style={{ padding: '6px' }}>
            {/* Stay connected toggle */}
            <div
              onClick={toggleStayConnected}
              style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'9px 12px', borderRadius:9, cursor:'pointer',
                transition:'background .15s', marginBottom:2,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12}}>⚡</span>
                <span style={{fontSize:12, color:'rgba(255,255,255,0.5)'}}>Stay connected</span>
              </div>
              {/* Toggle pill */}
              <div style={{
                width:32, height:18, borderRadius:100,
                background: stayConnected ? 'rgba(127,255,212,0.3)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${stayConnected ? 'rgba(127,255,212,0.4)' : 'rgba(255,255,255,0.15)'}`,
                position:'relative', transition:'all .2s',
                flexShrink:0,
              }}>
                <div style={{
                  position:'absolute', top:2,
                  left: stayConnected ? 'calc(100% - 16px)' : 2,
                  width:12, height:12, borderRadius:'50%',
                  background: stayConnected ? '#7fffd4' : 'rgba(255,255,255,0.4)',
                  transition:'all .2s',
                }}/>
              </div>
            </div>

            <button onClick={logout} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '9px 12px', borderRadius: 9, background: 'transparent', border: 'none',
              color: 'rgba(255,128,128,0.8)', fontSize: 12, cursor: 'pointer', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,128,128,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>↩</span> {isWallet ? 'Disconnect' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
