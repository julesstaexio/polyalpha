import * as React from "react"

function GlassFilter() {
  return (
    <svg style={{display:'none', position:'absolute'}}>
      <defs>
        <filter id="liquid-glass-filter" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence"/>
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise"/>
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced"/>
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur"/>
          <feComposite in="finalBlur" in2="finalBlur" operator="over"/>
        </filter>
      </defs>
    </svg>
  )
}

export function LiquidButton({ children, onClick, style }) {
  const [hovered, setHovered] = React.useState(false)
  const [pressed, setPressed] = React.useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px 48px',
        borderRadius: '100px',
        border: 'none',
        outline: 'none',
        cursor: 'pointer',
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 400,
        letterSpacing: '0.04em',
        color: 'rgba(255,255,255,0.92)',
        background: 'transparent',
        overflow: 'visible',
        transform: pressed ? 'scale(0.97)' : hovered ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform .2s cubic-bezier(.22,1,.36,1)',
        ...style,
      }}
    >
      {/* Backdrop distortion layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '100px',
        overflow: 'hidden',
        backdropFilter: 'url("#liquid-glass-filter") blur(2px)',
        WebkitBackdropFilter: 'url("#liquid-glass-filter") blur(2px)',
        zIndex: 0,
      }}/>

      {/* Glass shadow/border layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '100px',
        zIndex: 1,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)',
        boxShadow: [
          '0 0 0 1px rgba(255,255,255,0.20)',
          'inset 0 1px 0 rgba(255,255,255,0.30)',
          'inset 0 -1px 0 rgba(0,0,0,0.15)',
          'inset 3px 3px 0.5px -3.5px rgba(255,255,255,0.09)',
          'inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.85)',
          'inset 1px 1px 1px -0.5px rgba(255,255,255,0.6)',
          'inset -1px -1px 1px -0.5px rgba(255,255,255,0.6)',
          'inset 0 0 6px 6px rgba(255,255,255,0.06)',
          '0 4px 24px rgba(0,0,0,0.25)',
          hovered ? '0 0 20px rgba(255,255,255,0.08)' : '',
        ].filter(Boolean).join(', '),
        transition: 'box-shadow .2s',
        pointerEvents: 'none',
      }}/>

      {/* Top shine */}
      <div style={{
        position: 'absolute',
        top: 0, left: '10%', right: '10%',
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
        zIndex: 2,
        pointerEvents: 'none',
        borderRadius: '100px',
      }}/>

      {/* Text */}
      <span style={{ position: 'relative', zIndex: 3 }}>{children}</span>

      <GlassFilter/>
    </button>
  )
}
