import { useState } from 'react'
import { TrendingUp, Zap, Target, Activity, BarChart2, Globe } from 'lucide-react'

function BentoCard({ item, index }) {
  const [hovered, setHovered] = useState(false)

  const isActive = hovered || item.hasPersistentHover

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        gridColumn: item.colSpan === 2 ? 'span 2' : 'span 1',
        position: 'relative',
        padding: '18px 20px',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        background: isActive
          ? 'rgba(255,255,255,0.04)'
          : 'rgba(255,255,255,0.02)',
        transform: isActive ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isActive
          ? '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.10)'
          : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'all .25s cubic-bezier(.22,1,.36,1)',
        cursor: 'default',
        animation: `riseIn .5s cubic-bezier(.22,1,.36,1) both ${index * 60}ms`,
      }}
    >
      {/* Dot pattern overlay */}
      {isActive && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}/>
      )}

      {/* Gradient border */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.04) 100%)',
        opacity: isActive ? 1 : 0,
        transition: 'opacity .25s',
      }}/>

      {/* Content */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: isActive
              ? 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))'
              : 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .25s',
          }}>
            {item.icon}
          </div>
          {item.status && (
            <span style={{
              fontSize: 10, fontWeight: 500, padding: '3px 9px', borderRadius: 100,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: item.statusColor || 'rgba(255,255,255,0.5)',
              letterSpacing: '0.05em',
              transition: 'all .25s',
              ...(isActive ? { background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.75)' } : {}),
            }}>
              {item.status}
            </span>
          )}
        </div>

        {/* Title + meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <h3 style={{
              margin: 0, fontSize: 14, fontWeight: 500,
              color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.01em',
            }}>
              {item.title}
            </h3>
            {item.meta && (
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>
                {item.meta}
              </span>
            )}
          </div>
          <p style={{
            margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.5, fontWeight: 300,
          }}>
            {item.description}
          </p>
        </div>

        {/* Tags + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {item.tags?.map((tag, i) => (
              <span key={i} style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.35)',
                transition: 'all .2s',
                ...(isActive ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' } : {}),
              }}>
                #{tag}
              </span>
            ))}
          </div>
          <span style={{
            fontSize: 11, color: 'rgba(255,255,255,0.25)',
            opacity: isActive ? 1 : 0, transition: 'opacity .25s',
          }}>
            {item.cta || 'View →'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function BentoGrid({ markets = [], analyzed = [], hot = [], strong = [] }) {
  // Top BUY signals
  const topBuys = markets
    .filter(m => m.analysis?.verdict?.includes('BUY'))
    .sort((a,b) => Math.abs(b.analysis.aiProb - b.polyProb) - Math.abs(a.analysis.aiProb - a.polyProb))
    .slice(0, 2)

  // Top SELL signals
  const topSells = markets
    .filter(m => m.analysis?.verdict?.includes('SELL'))
    .sort((a,b) => Math.abs(b.analysis.aiProb - b.polyProb) - Math.abs(a.analysis.aiProb - a.polyProb))
    .slice(0, 1)

  const totalVol = markets.reduce((s, m) => s + (m.volume || 0), 0)
  const fmtVol = totalVol >= 1e9
    ? `$${(totalVol/1e9).toFixed(1)}B`
    : totalVol >= 1e6
    ? `$${(totalVol/1e6).toFixed(1)}M`
    : `$${(totalVol/1e3).toFixed(0)}K`

  const accuracy = analyzed.length > 0
    ? Math.round((strong.length / analyzed.length) * 100)
    : 0

  const items = [
    {
      title: 'Market Scanner',
      meta: `${markets.length} live`,
      description: `Scanning ${markets.length} active Polymarket markets in real time. ${analyzed.length} analyzed, ${markets.length - analyzed.length} pending.`,
      icon: <Globe size={16} color="rgba(168,196,255,0.8)"/>,
      status: 'Live',
      statusColor: 'rgba(127,255,212,0.7)',
      tags: ['Polymarket', 'Real-time'],
      colSpan: 2,
      hasPersistentHover: true,
      cta: 'Browse →',
    },
    {
      title: 'Total Volume',
      meta: fmtVol,
      description: 'Cumulative trading volume across all scanned markets.',
      icon: <BarChart2 size={16} color="rgba(255,217,122,0.8)"/>,
      status: `${analyzed.length} scanned`,
      tags: ['Volume'],
      cta: 'Details →',
    },
    {
      title: 'Top Buy Signal',
      meta: topBuys[0] ? `+${Math.round(Math.abs(topBuys[0].analysis.aiProb - topBuys[0].polyProb)*100)}% edge` : 'scanning…',
      description: topBuys[0]
        ? topBuys[0].question
        : 'No strong BUY signal detected yet — analysis in progress.',
      icon: <TrendingUp size={16} color="rgba(127,255,212,0.8)"/>,
      status: topBuys[0] ? topBuys[0].analysis.verdict : '—',
      statusColor: 'rgba(127,255,212,0.7)',
      tags: ['BUY', topBuys[0] ? `${Math.round(topBuys[0].polyProb*100)}% mkt` : ''],
      colSpan: 2,
      cta: 'Trade →',
    },
    {
      title: 'Top Sell Signal',
      meta: topSells[0] ? `-${Math.round(Math.abs(topSells[0].analysis.aiProb - topSells[0].polyProb)*100)}% edge` : 'scanning…',
      description: topSells[0]
        ? topSells[0].question
        : 'No strong SELL signal detected yet.',
      icon: <Zap size={16} color="rgba(255,128,128,0.8)"/>,
      status: topSells[0] ? topSells[0].analysis.verdict : '—',
      statusColor: 'rgba(255,128,128,0.7)',
      tags: ['SELL', topSells[0] ? `${Math.round(topSells[0].polyProb*100)}% mkt` : ''],
      cta: 'Trade →',
    },
    {
      title: 'Opportunities',
      meta: `${hot.length} hot`,
      description: `${hot.length} markets with >18% edge detected. ${strong.length} strong signals (STRONG BUY/SELL).`,
      icon: <Activity size={16} color="rgba(255,217,122,0.8)"/>,
      status: `${strong.length} strong`,
      statusColor: 'rgba(255,217,122,0.7)',
      tags: ['Alpha', 'Edge'],
      cta: 'Explore →',
    },
    {
      title: 'Signal Quality',
      meta: `${accuracy}% strong`,
      description: `${analyzed.length} markets analyzed. ${strong.length} returned strong signals with high confidence.`,
      icon: <Target size={16} color="rgba(168,196,255,0.8)"/>,
      status: analyzed.length > 0 ? 'Active' : 'Loading',
      tags: ['Algo', 'Quant'],
      colSpan: 2,
      cta: 'Methodology →',
    },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 12,
      padding: '16px 20px 8px',
    }}>
      {items.map((item, i) => (
        <BentoCard key={i} item={item} index={i}/>
      ))}
    </div>
  )
}
