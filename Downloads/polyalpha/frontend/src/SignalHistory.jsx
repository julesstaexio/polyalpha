// ─── SignalHistory.jsx ────────────────────────────────────────────────────────
// Signal history panel — win rate, P&L, list of past signals
// Import and drop into App.jsx as a new tab
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useSignals } from './useSignals.js'

const pct = n => `${Math.round(n * 100)}%`
const fmt = n => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${n}`

const VERDICT_COLOR = {
  'STRONG BUY':  '#00ffaa', 'BUY': '#00ffaa',
  'NEUTRAL':     '#7070a0',
  'SELL':        '#ff3d6b', 'STRONG SELL': '#ff3d6b',
}

function StatBox({ label, value, sub, color }) {
  return (
    <div style={{ background: '#0d0d1c', border: '1px solid #1a1a32', borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 9, color: '#4a4a7a', letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 24, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: color || '#eaeaf8' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 10, color: '#7070a0', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function ResultBadge({ result }) {
  if (!result) return <span style={{ fontSize: 10, color: '#4a4a7a', letterSpacing: 1 }}>OPEN</span>
  const map = {
    WIN:  { bg: 'rgba(0,255,170,0.1)', border: 'rgba(0,255,170,0.3)', color: '#00ffaa', icon: '✓' },
    LOSS: { bg: 'rgba(255,61,107,0.1)', border: 'rgba(255,61,107,0.3)', color: '#ff3d6b', icon: '✗' },
    PUSH: { bg: 'rgba(112,112,160,0.1)', border: 'rgba(112,112,160,0.3)', color: '#7070a0', icon: '~' },
  }
  const s = map[result] || map.PUSH
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
      {s.icon} {result}
    </span>
  )
}

function ResolveModal({ signal, onResolve, onClose }) {
  const [result, setResult]     = useState('WIN')
  const [finalProb, setFinalProb] = useState('')
  const [saving, setSaving]     = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    await onResolve(signal.id, result, finalProb ? parseFloat(finalProb) / 100 : null)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(7,7,14,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}
      onClick={onClose}>
      <div style={{ background: '#0d0d1c', border: '1px solid #2a2a4a', borderRadius: 16, padding: 32, width: 360, animation: 'fade-up 0.2s ease' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 6 }}>Resolve Signal</div>
        <div style={{ fontSize: 11, color: '#7070a0', marginBottom: 24, lineHeight: 1.6 }}>{signal.question}</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: '#4a4a7a', letterSpacing: 2, marginBottom: 8 }}>RESULT</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['WIN', 'LOSS', 'PUSH'].map(r => (
              <button key={r} onClick={() => setResult(r)} style={{
                flex: 1, padding: '8px 0', borderRadius: 7, cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                background: result === r ? (r==='WIN'?'rgba(0,255,170,0.15)':r==='LOSS'?'rgba(255,61,107,0.15)':'rgba(112,112,160,0.15)') : 'transparent',
                border: `1px solid ${result===r?(r==='WIN'?'rgba(0,255,170,0.4)':r==='LOSS'?'rgba(255,61,107,0.4)':'rgba(112,112,160,0.4)'):'#2a2a4a'}`,
                color: result===r?(r==='WIN'?'#00ffaa':r==='LOSS'?'#ff3d6b':'#7070a0'):'#7070a0',
              }}>{r}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: '#4a4a7a', letterSpacing: 2, marginBottom: 8 }}>FINAL MARKET PROB (%)</div>
          <input
            type="number" min="0" max="100" placeholder="e.g. 92"
            value={finalProb} onChange={e => setFinalProb(e.target.value)}
            style={{ width: '100%', background: '#131326', border: '1px solid #2a2a4a', borderRadius: 7, padding: '10px 14px', color: '#eaeaf8', fontFamily: "'Space Mono',monospace", fontSize: 13, outline: 'none' }}
          />
          <div style={{ fontSize: 10, color: '#4a4a7a', marginTop: 4 }}>Used to estimate P&L · leave empty if unknown</div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 7, color: '#7070a0', cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: 11 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '10px 0', background: 'linear-gradient(135deg,#6c47ff,#9c77ff)', border: 'none', borderRadius: 7, color: 'white', cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: 11, fontWeight: 700 }}>
            {saving ? 'Saving…' : 'Save Result'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SignalHistory() {
  const { signals, stats, loading, resolveSignal } = useSignals()
  const [resolving, setResolving] = useState(null) // signal being resolved
  const [filter, setFilter]       = useState('all') // all | open | resolved

  const filtered = signals.filter(s => {
    if (filter === 'open')     return !s.resolved
    if (filter === 'resolved') return s.resolved
    return true
  })

  const Tab = ({ id, label }) => (
    <button onClick={() => setFilter(id)} style={{
      background: filter===id ? '#6c47ff' : 'transparent',
      border: `1px solid ${filter===id ? '#6c47ff' : '#242444'}`,
      color: filter===id ? 'white' : '#7070a0',
      padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
      fontSize: 10, fontFamily: "'Space Mono',monospace", letterSpacing: 1.5, transition: 'all 0.2s',
    }}>{label}</button>
  )

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatBox label="Total Signals" value={stats?.total ?? 0} sub="all time" color="#00d4ff" />
        <StatBox label="Win Rate"
          value={stats?.winRate != null ? `${stats.winRate}%` : '—'}
          sub={`${stats?.wins ?? 0}W · ${stats?.losses ?? 0}L`}
          color={stats?.winRate >= 50 ? '#00ffaa' : '#ff3d6b'}
        />
        <StatBox label="Avg P&L"
          value={stats?.avgPnl != null ? `${stats.avgPnl > 0 ? '+' : ''}${stats.avgPnl}%` : '—'}
          sub="per resolved signal"
          color={stats?.avgPnl >= 0 ? '#00ffaa' : '#ff3d6b'}
        />
        <StatBox label="Total P&L"
          value={stats?.totalPnl != null ? `${stats.totalPnl > 0 ? '+' : ''}${stats.totalPnl}%` : '—'}
          sub="cumulative"
          color={stats?.totalPnl >= 0 ? '#00ffaa' : '#ff3d6b'}
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <Tab id="all"      label={`ALL (${signals.length})`} />
        <Tab id="open"     label={`OPEN (${signals.filter(s=>!s.resolved).length})`} />
        <Tab id="resolved" label={`RESOLVED (${signals.filter(s=>s.resolved).length})`} />
      </div>

      {/* Table */}
      <div style={{ background: '#0d0d1c', border: '1px solid #1a1a32', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 80px 80px 90px 80px', gap: 12, padding: '11px 20px', borderBottom: '1px solid #1a1a32', fontSize: 9, color: '#4a4a7a', letterSpacing: 2 }}>
          <span>QUESTION</span>
          <span>SIGNAL</span>
          <span>PROBA (MKT → AI)</span>
          <span style={{textAlign:'center'}}>RESULT</span>
          <span style={{textAlign:'right'}}>P&L</span>
          <span style={{textAlign:'right'}}>DATE</span>
          <span style={{textAlign:'center'}}>ACTION</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#4a4a7a', fontSize: 12 }}>Loading signals…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
            <div style={{ color: '#4a4a7a', fontSize: 12 }}>No signals yet — analyze a market to save your first signal</div>
          </div>
        ) : filtered.map((s, i) => (
          <div key={s.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 100px 140px 80px 80px 90px 80px',
            gap: 12, padding: '13px 20px',
            borderBottom: i < filtered.length-1 ? '1px solid #1a1a32' : 'none',
            animation: 'fade-up 0.3s ease both', animationDelay: `${i*0.03}s`,
            background: 'transparent', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(108,71,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <div>
              <div style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 4 }}>{s.question}</div>
              <div style={{ fontSize: 9, color: '#4a4a7a', letterSpacing: 1 }}>{s.verdict}</div>
            </div>

            <div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1,
                color: s.signal==='LONG' ? '#00ffaa' : '#ff3d6b',
              }}>
                {s.signal==='LONG' ? '▲' : '▼'} {s.signal}
              </span>
              <div style={{ fontSize: 9, color: '#4a4a7a', marginTop: 3 }}>{s.confidence}% conf.</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>
                {pct(s.poly_prob)}
                <span style={{ color: '#4a4a7a', margin: '0 4px' }}>→</span>
                <span style={{ color: s.signal==='LONG' ? '#00ffaa' : '#ff3d6b' }}>{pct(s.ai_prob)}</span>
              </div>
              <div style={{ fontSize: 9, color: '#4a4a7a', marginTop: 2 }}>Δ {pct(s.gap)}</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <ResultBadge result={s.result} />
            </div>

            <div style={{ textAlign: 'right' }}>
              {s.pnl != null ? (
                <span style={{ fontSize: 13, fontWeight: 700, color: s.pnl >= 0 ? '#00ffaa' : '#ff3d6b' }}>
                  {s.pnl > 0 ? '+' : ''}{s.pnl}%
                </span>
              ) : <span style={{ color: '#4a4a7a', fontSize: 11 }}>—</span>}
            </div>

            <div style={{ textAlign: 'right', fontSize: 10, color: '#7070a0' }}>
              {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              <div style={{ fontSize: 9, color: '#4a4a7a' }}>
                {new Date(s.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              {!s.resolved ? (
                <button onClick={() => setResolving(s)} style={{
                  background: 'rgba(108,71,255,0.1)', border: '1px solid rgba(108,71,255,0.3)',
                  borderRadius: 5, padding: '4px 8px', cursor: 'pointer',
                  color: '#9c77ff', fontSize: 9, fontFamily: "'Space Mono',monospace",
                  letterSpacing: 0.5, transition: 'all 0.15s',
                }}>RESOLVE</button>
              ) : (
                <span style={{ fontSize: 9, color: '#4a4a7a' }}>✓ done</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Resolve modal */}
      {resolving && (
        <ResolveModal
          signal={resolving}
          onResolve={resolveSignal}
          onClose={() => setResolving(null)}
        />
      )}

      <style>{`@keyframes fade-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}
