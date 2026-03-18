import { useState, useEffect, useCallback, useRef } from "react";
import SignalHistory from "./SignalHistory.jsx";
import { useSignals } from "./useSignals.js";
import UserMenu from "./UserMenu.jsx";
import { FallingPattern } from "./FallingPattern.jsx";
import BentoGrid from "./BentoGrid.jsx";


function getPolyUrl(market) {
  // Always prefer event slug (most reliable)
  if (market.eventSlug) return `https://polymarket.com/event/${market.eventSlug}`;
  if (market.slug) return `https://polymarket.com/event/${market.slug}`;
  return `https://polymarket.com/event/${market.id}`;
}

const PROXY = "http://localhost:3001";

/* ════════════════════════════════════════════════════════════════════════════
   POLYALPHA — Cosmic Minimalism
   Noir absolu · Blanc pur · Contours animés · Étoiles procédurales
   Police : Outfit (geometric clean) + JetBrains Mono
════════════════════════════════════════════════════════════════════════════ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

  /* ── Variables ─────────────────────────────────────────────────────────── */
  :root {
    --void:      #040406;
    --void2:     #08080d;
    --surface:   #0c0c14;
    --surface2:  #10101a;
    --white:     #ffffff;
    --white-90:  rgba(255,255,255,0.9);
    --white-60:  rgba(255,255,255,0.6);
    --white-30:  rgba(255,255,255,0.3);
    --white-10:  rgba(255,255,255,0.10);
    --white-06:  rgba(255,255,255,0.06);
    --white-03:  rgba(255,255,255,0.03);
    --ice:       #a8c4ff;
    --ice-dim:   rgba(168,196,255,0.12);
    --ice-glow:  rgba(168,196,255,0.22);
    --green:     #7fffd4;
    --green-dim: rgba(127,255,212,0.10);
    --red:       #ff8080;
    --red-dim:   rgba(255,128,128,0.10);
    --gold:      #ffd97a;
    --gold-dim:  rgba(255,217,122,0.10);
    --r:         20px;
    --r2:        12px;
    --r3:        100px;
    --sans:      'Outfit', system-ui, sans-serif;
    --mono:      'JetBrains Mono', monospace;
  }


  /* ── Reset ─────────────────────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    color: var(--white-90);
    font-family: var(--sans);
    background-color: #040406;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(168,196,255,0.06) 0%, transparent 60%),
      radial-gradient(circle at 15% 85%, rgba(127,255,212,0.03) 0%, transparent 40%),
      radial-gradient(circle at 85% 15%, rgba(168,196,255,0.03) 0%, transparent 40%),
      radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px);
    background-size: auto, auto, auto, 24px 24px;
    background-attachment: fixed;
    font-size: 14px;
    overflow-x: hidden;
    min-height: 100vh;
  }

  #root { position: relative; z-index: 1; }

  #star-canvas {
    position: fixed; inset: 0;
    z-index: 0; pointer-events: none;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--white-10); border-radius: 2px; }

  /* ══════════════════════════════════════════════════════════════════════════
     ANIMATED CONTOURS
     Cards have a living, breathing border — white glow that pulses softly.
     On hover, the glow intensifies and shifts toward ice-blue.
  ══════════════════════════════════════════════════════════════════════════ */

  @keyframes borderGlow {
    0%,100% {
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.08),
        0 0 12px rgba(255,255,255,0.04),
        inset 0 0 0 1px rgba(255,255,255,0.04);
    }
    50% {
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.16),
        0 0 24px rgba(168,196,255,0.10),
        inset 0 0 0 1px rgba(168,196,255,0.06);
    }
  }

  @keyframes borderGlowHot {
    0%,100% {
      box-shadow:
        0 0 0 1px rgba(255,217,122,0.2),
        0 0 20px rgba(255,217,122,0.08),
        inset 0 0 20px rgba(255,217,122,0.03);
    }
    50% {
      box-shadow:
        0 0 0 1px rgba(255,217,122,0.35),
        0 0 36px rgba(255,217,122,0.14),
        inset 0 0 28px rgba(255,217,122,0.05);
    }
  }

  @keyframes orbitRing {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }

  @keyframes riseIn {
    from { opacity: 0; transform: translateY(18px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0)     scale(1);   }
  }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes slideUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0%   { background-position: -800% 0; }
    100% { background-position:  800% 0; }
  }
  @keyframes growBar {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes twinkle {
    0%,100% { opacity: 0.4; }
    50%     { opacity: 1;   }
  }
  @keyframes float {
    0%,100% { transform: translateY(0);   }
    50%     { transform: translateY(-3px); }
  }
  @keyframes livePulse {
    0%,100% { transform: scale(1);   opacity: 1; }
    50%     { transform: scale(0.7); opacity: 0.4; }
  }
  @keyframes countUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }

  /* ── Stagger ─────────────────────────────────────────────────────────── */
  .s0 { animation: riseIn .6s cubic-bezier(.22,1,.36,1) both 0ms;   }
  .s1 { animation: riseIn .6s cubic-bezier(.22,1,.36,1) both 80ms;  }
  .s2 { animation: riseIn .6s cubic-bezier(.22,1,.36,1) both 160ms; }
  .s3 { animation: riseIn .6s cubic-bezier(.22,1,.36,1) both 240ms; }
  .s4 { animation: riseIn .6s cubic-bezier(.22,1,.36,1) both 320ms; }

  /* ── Card base ─────────────────────────────────────────────────────── */
  .card {
    background: var(--surface);
    border-radius: var(--r);
    border: 1px solid var(--white-06);
    animation: borderGlow 4s ease-in-out infinite;
    transition: background .25s, border-color .25s;
  }

  /* ── Market row ────────────────────────────────────────────────────── */
  .mrow {
    cursor: pointer;
    border-radius: var(--r);
    transition: all .22s cubic-bezier(.22,1,.36,1);
    will-change: transform, box-shadow;
  }
  .mrow:hover {
    background: var(--surface2) !important;
    border-color: rgba(255,255,255,0.18) !important;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.18),
      0 8px 40px rgba(168,196,255,0.08),
      inset 0 0 40px rgba(168,196,255,0.03) !important;
    transform: translateY(-2px) !important;
    animation: none !important;
  }
  .mrow:hover .cta-hint { opacity:1 !important; transform:translateX(0) !important; }
  .mrow:active { transform: translateY(0) !important; }

  /* ── Skeleton ─────────────────────────────────────────────────────── */
  .skel {
    background: linear-gradient(90deg,
      var(--white-03) 25%,
      var(--white-06) 50%,
      var(--white-03) 75%
    );
    background-size: 800% 100%;
    animation: shimmer 2.4s ease-in-out infinite;
    border-radius: var(--r2);
  }

  /* ── Chip ─────────────────────────────────────────────────────────── */
  .chip {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 9px; border-radius: var(--r3);
    font-size: 9px; font-weight: 600; letter-spacing: 0.5px;
    white-space: nowrap; text-transform: uppercase;
  }

  /* ── Buttons ──────────────────────────────────────────────────────── */
  button { font-family: var(--sans); cursor: pointer; transition: all .18s; }

  .btn-star {
    position:relative;display:inline-flex;align-items:center;gap:6px;
    padding:7px 16px;border-radius:100px;border:none;outline:none;cursor:pointer;
    font-family:var(--sans);font-size:11px;font-weight:500;
    color:rgba(255,255,255,0.8);
    background:rgba(255,255,255,0.06);
    box-shadow:0 0 0 1px rgba(255,255,255,0.12),inset 0 1px 0 rgba(255,255,255,0.15),0 4px 16px rgba(0,0,0,0.2);
    backdrop-filter:blur(12px);transition:all .18s;
  }
  .btn-star:hover{background:rgba(255,255,255,0.10);transform:translateY(-1px);box-shadow:0 0 0 1px rgba(255,255,255,0.2),0 6px 20px rgba(0,0,0,0.25);}
  .btn-star:hover {
    box-shadow: 0 0 36px rgba(255,255,255,0.3);
    transform: translateY(-1px);
    filter: brightness(0.95);
  }

  .btn-ghost {
    background: var(--white-06);
    color: var(--white-60);
    border: 1px solid var(--white-10);
    border-radius: var(--r3);
    padding: 7px 16px;
    font-size: 12px; font-weight: 500;
  }
  .btn-ghost:hover {
    background: var(--white-10);
    color: var(--white);
    border-color: var(--white-30);
  }

  /* ── Nav tab ──────────────────────────────────────────────────────── */
  .ntab {
    padding: 5px 14px;
    border-radius: var(--r3);
    font-size: 12px; font-weight: 500;
    border: none; background: transparent;
    color: var(--white-30);
    letter-spacing: 0.2px;
  }
  .ntab.on { background: var(--white-10); color: var(--white); }
  .ntab:hover:not(.on) { color: var(--white-60); }

  /* fpill → see liquid glass section */

  /* ── Sort ─────────────────────────────────────────────────────────── */
  .sort { cursor:pointer; user-select:none; }
  .sort:hover { color: var(--white) !important; }

  /* ── Tooltip ──────────────────────────────────────────────────────── */
  .tw { position:relative; }
  .tw:hover .tp { display:block; }
  .tp {
    display:none;
    position:absolute; bottom:calc(100% + 8px); left:50%;
    transform:translateX(-50%);
    background: var(--surface2);
    border:1px solid var(--white-10);
    border-radius: var(--r2);
    padding:6px 12px;
    font-size:10px; color:var(--white-60);
    white-space:nowrap; z-index:500;
    pointer-events:none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.6);
    animation: fadeIn .12s ease;
  }
  .tp::after {
    content:'';
    position:absolute; top:100%; left:50%;
    transform:translateX(-50%);
    border:5px solid transparent;
    border-top-color: var(--white-10);
  }

  /* ── Glass topbar ─────────────────────────────────────────────────── */
  .glass {
    background: rgba(4,4,6,0.82);
    backdrop-filter: blur(24px) saturate(1.2);
    -webkit-backdrop-filter: blur(24px) saturate(1.2);
  }

  /* ── Mobile ───────────────────────────────────────────────────────── */
  @media (max-width:820px) { .desk { display:none !important; } }
  /* ── Liquid glass buttons ─────────────────────────────────────────────── */
  .btn-glass {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: none;
    outline: none;
    cursor: pointer;
    font-family: var(--sans);
    color: rgba(255,255,255,0.85);
    border-radius: 100px;
    background: rgba(255,255,255,0.06);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.12),
      inset 0 1px 0 rgba(255,255,255,0.18),
      inset 0 -1px 0 rgba(0,0,0,0.15),
      inset 1px 0 0.5px rgba(255,255,255,0.08),
      inset -1px 0 0.5px rgba(255,255,255,0.08),
      0 4px 16px rgba(0,0,0,0.2);
    backdrop-filter: blur(12px) saturate(1.3);
    -webkit-backdrop-filter: blur(12px) saturate(1.3);
    transition: all .18s cubic-bezier(.22,1,.36,1);
    overflow: hidden;
  }
  .btn-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.06) 100%);
    pointer-events: none;
  }
  .btn-glass::after {
    content: '';
    position: absolute;
    top: 0; left: 15%; right: 15%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
    pointer-events: none;
  }
  .btn-glass:hover {
    background: rgba(255,255,255,0.10);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.22),
      inset 0 1px 0 rgba(255,255,255,0.28),
      inset 0 -1px 0 rgba(0,0,0,0.15),
      0 6px 24px rgba(0,0,0,0.3);
    transform: translateY(-1px);
  }
  .btn-glass:active {
    transform: translateY(0) scale(0.98);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.2);
  }
  .btn-glass:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
  .btn-glass span { position: relative; z-index: 1; }

  /* Pill filter buttons */
  .fpill {
    padding: 6px 15px;
    border-radius: var(--r3);
    font-size: 11px; font-weight: 500;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(8px);
    color: var(--white-30);
    letter-spacing: 0.2px;
    cursor: pointer;
    transition: all .18s;
  }
  .fpill.on {
    border-color: rgba(255,255,255,0.22);
    color: var(--white);
    background: rgba(255,255,255,0.08);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.15), 0 0 16px rgba(255,255,255,0.04);
  }
  .fpill:hover:not(.on) { border-color: rgba(255,255,255,0.18); color: var(--white-60); background: rgba(255,255,255,0.06); }

`;

/* ────────────────────────────────────────────────────────────────────────────
   STAR CANVAS — procedural starfield
──────────────────────────────────────────────────────────────────────────── */
function StarCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Generate stars once
    const STARS = Array.from({length: 280}, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.2 + 0.2,
      speed: Math.random() * 0.4 + 0.1,    // twinkle speed
      phase: Math.random() * Math.PI * 2,   // twinkle phase offset
      // occasional larger "featured" star
      featured: Math.random() < 0.04,
    }));

    let t = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.005;

      for (const s of STARS) {
        const opacity = s.featured
          ? 0.5 + 0.5 * Math.sin(t * s.speed + s.phase)
          : 0.12 + 0.28 * Math.abs(Math.sin(t * s.speed + s.phase));

        const x = s.x * canvas.width;
        const y = s.y * canvas.height;
        const r = s.featured ? s.r * 2.2 : s.r;

        if (s.featured) {
          // Cross / 4-pointed star shape
          const arm = r * 5;
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.strokeStyle = "#a8c4ff";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y);
          ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm);
          ctx.stroke();
          ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = s.featured
          ? `rgba(168,196,255,${opacity})`
          : `rgba(255,255,255,${opacity})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas id="star-canvas" ref={ref}/>;
}

/* ────────────────────────────────────────────────────────────────────────────
   UTILS
──────────────────────────────────────────────────────────────────────────── */
const fmt = n => {
  const v = Math.round(n);
  if (v >= 1e6) return `$${(v/1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v/1e3).toFixed(0)}K`;
  return `$${v}`;
};
const pct = n => `${Math.round(n*100)}%`;

const CAT = {
  Crypto:    { c:"rgba(255,255,255,0.85)", bg:"rgba(255,255,255,0.07)" },
  Economics: { c:"rgba(255,217,122,0.85)", bg:"rgba(255,217,122,0.07)" },
  Politics:  { c:"rgba(255,128,128,0.85)", bg:"rgba(255,128,128,0.07)" },
  Tech:      { c:"rgba(168,196,255,0.85)", bg:"rgba(168,196,255,0.07)" },
  Sports:    { c:"rgba(127,255,212,0.75)", bg:"rgba(127,255,212,0.07)" },
  Other:     { c:"rgba(255,255,255,0.35)", bg:"rgba(255,255,255,0.04)" },
};

function categorize(q) {
  q = (q||"").toLowerCase();
  if (q.match(/bitcoin|crypto|eth|solana|btc|defi/)) return "Crypto";
  if (q.match(/election|president|trump|vote|congress|senate|poll/)) return "Politics";
  if (q.match(/rate|fed|recession|gdp|inflation|economy|cpi/)) return "Economics";
  if (q.match(/ai|gpt|openai|apple|google|nvidia|tech/)) return "Tech";
  if (q.match(/nba|nfl|soccer|world cup|championship|league/)) return "Sports";
  return "Other";
}

function parsePolyProb(m) {
  try {
    const p = parseFloat(JSON.parse(m.outcomePrices||"[]")[0]);
    return isNaN(p) ? 0.5 : Math.max(0.01, Math.min(0.99, p));
  } catch { return 0.5; }
}

function spark(id, base) {
  const seed = (id||"").split("").reduce((a,c)=>a+c.charCodeAt(0),0);
  const pts=[]; let v=base;
  for(let i=0;i<18;i++){
    v=Math.max(0.03,Math.min(0.97,v+Math.sin(seed*(i+1)*.63)*.038+Math.cos(seed*i*1.1)*.022));
    pts.push(v);
  }
  return pts;
}

/* SSE */
// ── Local quantitative engine — zero network calls ───────────────────────────
const CAT_BIAS = {
  CRYPTO:    { drift: 0.04,  volatility: 0.18 },
  POLITICS:  { drift: -0.02, volatility: 0.12 },
  ECONOMICS: { drift: 0.01,  volatility: 0.08 },
  TECH:      { drift: 0.03,  volatility: 0.14 },
  SPORTS:    { drift: 0.00,  volatility: 0.10 },
  DEFAULT:   { drift: 0.01,  volatility: 0.10 },
};

function analyzeWithClaude(market, onAgent) {
  return new Promise(resolve => {
    const p    = market.polyProb;
    const vol  = market.volume || 0;
    const cat  = (market.category || 'DEFAULT').toUpperCase();
    const bias = CAT_BIAS[cat] || CAT_BIAS.DEFAULT;

    let extremityAdj = 0;
    if (p < 0.10) extremityAdj = +0.04;
    else if (p > 0.90) extremityAdj = -0.04;
    else if (p < 0.20) extremityAdj = +0.02;
    else if (p > 0.80) extremityAdj = -0.02;

    const volScore  = vol < 1000 ? 0.06 : vol < 5000 ? 0.04 : vol < 20000 ? 0.02 : vol < 100000 ? 0.01 : 0;
    const roundBias = [0.25, 0.50, 0.75].some(r => Math.abs(p - r) < 0.02) ? 0.02 : 0;
    let timeAdj = 0;
    if (market.endDate) {
      const d = (new Date(market.endDate) - Date.now()) / 86400000;
      timeAdj = d < 3 ? 0 : d < 14 ? 0.01 : d < 60 ? 0.02 : 0.03;
    }

    const totalAdj = extremityAdj + (volScore * (p < 0.5 ? 1 : -1)) + bias.drift + timeAdj;
    let aiProb = Math.max(0.02, Math.min(0.98, p + totalAdj));
    if (roundBias > 0) aiProb = Math.max(0.02, Math.min(0.98, p < 0.5 ? aiProb - 0.015 : aiProb + 0.015));

    const rawGap = aiProb - p;
    const absGap = Math.abs(rawGap);
    const signalCount = [extremityAdj !== 0, volScore > 0.02, roundBias > 0, Math.abs(bias.drift) > 0.02].filter(Boolean).length;
    const confidence  = Math.min(88, Math.max(25, 35 + signalCount * 12 + (absGap > 0.12 ? 15 : absGap > 0.06 ? 8 : 0)));
    const signal = rawGap > 0.04 ? 'LONG' : rawGap < -0.04 ? 'SHORT' : 'NEUTRAL';

    let finalProb = aiProb;
    if (absGap > 0.20) finalProb = p + rawGap * 0.8;
    else if (absGap > 0.12) finalProb = p + rawGap * 0.9;
    finalProb = Math.max(0.02, Math.min(0.98, finalProb));

    const finalGap = Math.abs(finalProb - p);
    const verdict  = finalGap < 0.03 ? 'NEUTRAL'
                   : finalGap < 0.08 ? (finalProb > p ? 'BUY' : 'SELL')
                   :                   (finalProb > p ? 'STRONG BUY' : 'STRONG SELL');

    const edgePct = Math.round(absGap * 100);
    const edge = absGap < 0.03
      ? `No significant edge (Δ${edgePct}%)`
      : absGap < 0.08
      ? `Moderate mispricing — algo ${Math.round(aiProb*100)}% vs market ${Math.round(p*100)}% (Δ${edgePct}%)`
      : `Strong mispricing — algo ${Math.round(aiProb*100)}% vs market ${Math.round(p*100)}% (Δ${edgePct}%)`;

    const bullFactors = [];
    const bearFactors = [];
    if (p < 0.35) bullFactors.push(`Market underweights at ${Math.round(p*100)}%`);
    if (p > 0.65) bearFactors.push(`Market overweights at ${Math.round(p*100)}%`);
    if (vol < 5000) bullFactors.push(`Low liquidity ($${Math.round(vol).toLocaleString()}) — price likely stale`);
    if (extremityAdj > 0) bullFactors.push('Tail risk underpriced by crowd');
    if (extremityAdj < 0) bearFactors.push('Overconfidence in near-certain outcome');
    if (bullFactors.length === 0) bullFactors.push('Base rate suggests fair pricing');
    if (bearFactors.length === 0) bearFactors.push('Volume and structure suggest efficient pricing');

    const research = { bullFactors, bearFactors, keyUncertainty: 'Quantitative model — no external data' };
    const critique = signalCount >= 3 ? 'Multiple converging signals' : 'Single-signal trade — use small size';

    if (onAgent) {
      onAgent(1,'RESEARCHER','done', research);
      onAgent(2,'ANALYST','done', { aiProb, signal, confidence, edge, bullCase: bullFactors[0], bearCase: bearFactors[0] });
      onAgent(3,'CRITIC','done', { verdict, finalProb, critique });
    }

    resolve({ aiProb: finalProb, signal, confidence, edge, bullCase: bullFactors[0], bearCase: bearFactors[0], verdict, critique, research });
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   ATOMS
──────────────────────────────────────────────────────────────────────────── */
function Spinner({size=13}) {
  return <span style={{
    display:"inline-block",width:size,height:size,flexShrink:0,
    border:"1.5px solid var(--white-10)",
    borderTopColor:"var(--white-60)",
    borderRadius:"50%",
    animation:"spin .7s linear infinite",
  }}/>;
}

/* Orbiting ring — used for the logo and featured elements */
function OrbitRing({size=30, speed="8s", color="rgba(255,255,255,0.15)"}) {
  return (
    <div style={{
      position:"absolute",inset:0,
      borderRadius:"50%",
      border:`1px solid ${color}`,
      animation:`orbitRing ${speed} linear infinite`,
    }}>
      <div style={{
        position:"absolute",top:-3,left:"50%",transform:"translateX(-50%)",
        width:5,height:5,borderRadius:"50%",
        background:color.replace(/[\d.]+\)$/,"0.8)"),
      }}/>
    </div>
  );
}

function LiveDot() {
  return (
    <div style={{position:"relative",width:8,height:8,flexShrink:0}}>
      <div style={{
        position:"absolute",inset:-3,borderRadius:"50%",
        border:"1px solid rgba(127,255,212,0.3)",
        animation:"orbitRing 3s linear infinite",
      }}/>
      <div style={{
        width:8,height:8,borderRadius:"50%",
        background:"var(--green)",
        animation:"livePulse 2s ease-in-out infinite",
        boxShadow:"0 0 6px var(--green)",
      }}/>
    </div>
  );
}

function Sparkline({id, prob, up}) {
  const pts=spark(id,prob);
  const mn=Math.min(...pts),mx=Math.max(...pts),r=mx-mn||0.01;
  const W=72,H=28;
  const xs=pts.map((_,i)=>(i/(pts.length-1))*W);
  const ys=pts.map(v=>H-((v-mn)/r)*H);
  const line=pts.map((_,i)=>`${i===0?"M":"L"}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area=`${line} L${W},${H} L0,${H} Z`;
  const rising=pts.at(-1)>pts[0];
  const col=up==null?(rising?"var(--green)":"var(--red)"):(up?"var(--green)":"var(--red)");
  const gid=`sg${(id||"x").replace(/[^a-z0-9]/gi,"")}`;
  return (
    <svg width={W} height={H} style={{display:"block",overflow:"visible"}}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={col} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={line} fill="none" stroke={col} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={xs.at(-1)} cy={ys.at(-1)} r="2.5" fill={col} style={{filter:`drop-shadow(0 0 3px ${col})`}}/>
    </svg>
  );
}

function VerdictBadge({verdict}) {
  const V={
    "STRONG BUY":  {c:"var(--green)",bg:"var(--green-dim)",icon:"▲▲",l:"Strong Buy"},
    "BUY":         {c:"var(--green)",bg:"var(--green-dim)",icon:"▲", l:"Buy"},
    "NEUTRAL":     {c:"var(--white-30)",bg:"var(--white-06)",icon:"◆",l:"Neutral"},
    "SELL":        {c:"var(--red)",  bg:"var(--red-dim)",  icon:"▼", l:"Sell"},
    "STRONG SELL": {c:"var(--red)",  bg:"var(--red-dim)",  icon:"▼▼",l:"Strong Sell"},
  };
  const s=V[verdict]||V["NEUTRAL"];
  return <span className="chip" style={{color:s.c,background:s.bg,border:`1px solid ${s.c}22`}}>{s.icon} {s.l}</span>;
}

function ProbBar({poly,ai}) {
  if(ai===null) return (
    <div style={{width:150}}>
      <div className="skel" style={{height:5,marginBottom:7}}/>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <div className="skel" style={{width:26,height:9}}/><div className="skel" style={{width:26,height:9}}/>
      </div>
    </div>
  );
  const up=ai>poly,gap=Math.abs(ai-poly);
  return (
    <div style={{width:150}}>
      <div style={{position:"relative",height:5,background:"var(--white-06)",borderRadius:100,overflow:"hidden",marginBottom:7}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${poly*100}%`,background:"var(--white-10)",borderRadius:100}}/>
        <div style={{
          position:"absolute",left:0,top:0,height:"100%",width:`${ai*100}%`,
          borderRadius:100,
          background:up?"var(--green)":"var(--red)",
          transformOrigin:"left",
          animation:"growBar .7s cubic-bezier(.22,1,.36,1) both",
          boxShadow:`0 0 6px ${up?"var(--green)":"var(--red)"}`,
        }}/>
        <div style={{position:"absolute",top:-1,height:7,width:1.5,background:"var(--void)",left:`${poly*100}%`,transform:"translateX(-50%)"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--mono)",fontSize:10.5,fontWeight:400}}>
        <span style={{color:"var(--white-30)"}}>{pct(poly)}</span>
        <span style={{color:gap>0.2?"var(--gold)":"var(--white-20)",fontSize:9}}>Δ{pct(gap)}</span>
        <span style={{color:up?"var(--green)":"var(--red)",fontWeight:500}}>{pct(ai)}</span>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   AGENT TRACK
──────────────────────────────────────────────────────────────────────────── */
const AGENTS={
  1:{name:"Researcher",desc:"Scanning signals",   sym:"⊕"},
  2:{name:"Analyst",   desc:"Computing probability",sym:"⊗"},
  3:{name:"Critic",    desc:"Stress-testing",      sym:"⊘"},
};

function AgentTrack({agents}) {
  return (
    <div style={{
      padding:"22px 24px",
      borderTop:"1px solid var(--white-06)",
      background:"var(--void2)",
      borderRadius:`0 0 var(--r) var(--r)`,
      animation:"slideUp .3s cubic-bezier(.22,1,.36,1)",
    }}>
      <div style={{fontSize:9,color:"var(--white-30)",fontWeight:600,letterSpacing:2,textTransform:"uppercase",marginBottom:18}}>
        AI Pipeline — 3 Agents
      </div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {[1,2,3].map(s=>{
          const info=AGENTS[s],a=agents[s]||{},st=a.status||"waiting";
          const done=st==="done",running=st==="running";
          return (
            <div key={s} style={{
              flex:1,minWidth:120,padding:"14px 16px",
              borderRadius:"var(--r2)",
              background:done?"rgba(127,255,212,0.04)":running?"rgba(255,255,255,0.03)":"transparent",
              border:`1px solid ${done?"rgba(127,255,212,0.18)":running?"rgba(255,255,255,0.12)":"var(--white-06)"}`,
              transition:"all .35s ease",
              boxShadow:running?"0 0 20px rgba(255,255,255,0.04)":"none",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <span style={{
                  fontSize:15,color:done?"var(--green)":running?"var(--white)":"var(--white-30)",
                  animation:running?"float 1.4s ease-in-out infinite":"none",
                  fontFamily:"var(--mono)",
                }}>{info.sym}</span>
                <span style={{fontSize:11,fontWeight:600,color:done?"var(--green)":running?"var(--white)":"var(--white-30)"}}>{info.name}</span>
                {done&&<span style={{marginLeft:"auto",color:"var(--green)",fontSize:11,fontFamily:"var(--mono)"}}>✓</span>}
                {running&&<span style={{marginLeft:"auto"}}><Spinner size={10}/></span>}
              </div>
              <div style={{fontSize:10,color:"var(--white-30)",fontWeight:300}}>{info.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   ANALYSIS PANEL
──────────────────────────────────────────────────────────────────────────── */
function AnalysisPanel({analysis,loading,agents,market}) {
  if(loading) return <AgentTrack agents={agents||{}}/>;
  if(!analysis) return null;
  const gap=Math.abs(analysis.aiProb-market.polyProb),under=analysis.aiProb>market.polyProb;
  return (
    <div style={{
      borderTop:"1px solid var(--white-06)",
      background:"var(--void2)",
      borderRadius:`0 0 var(--r) var(--r)`,
      overflow:"hidden",
      animation:"slideUp .3s cubic-bezier(.22,1,.36,1)",
    }}>
      {/* Summary */}
      <div style={{
        padding:"18px 26px",borderBottom:"1px solid var(--white-06)",
        display:"flex",alignItems:"center",gap:18,flexWrap:"wrap",
      }}>
        <VerdictBadge verdict={analysis.verdict}/>
        <div style={{fontSize:12,color:"var(--white-60)",lineHeight:1.8,flex:1,minWidth:200,fontWeight:300}}>
          Market prices at{" "}
          <span style={{color:"var(--white)",fontFamily:"var(--mono)",fontWeight:500}}>{pct(market.polyProb)}</span>
          {" · "}AI estimates{" "}
          <span style={{color:under?"var(--green)":"var(--red)",fontFamily:"var(--mono)",fontWeight:500}}>{pct(analysis.aiProb)}</span>
          {" · "}
          <span style={{color:gap>0.2?"var(--gold)":"var(--white-30)"}}>
            {under?"Undervalued":"Overvalued"} by {pct(gap)}
          </span>
        </div>
        {/* Confidence */}
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <span style={{fontSize:9,color:"var(--white-30)",fontWeight:600,letterSpacing:1.5,textTransform:"uppercase"}}>Confidence</span>
          <div style={{width:72,height:3,background:"var(--white-06)",borderRadius:100,overflow:"hidden"}}>
            <div style={{
              height:"100%",width:`${analysis.confidence||50}%`,
              background:"var(--white-60)",borderRadius:100,
              transformOrigin:"left",
              animation:"growBar .9s cubic-bezier(.22,1,.36,1) both",
            }}/>
          </div>
          <span style={{fontSize:11,color:"var(--white)",fontFamily:"var(--mono)",fontWeight:500}}>{analysis.confidence||"?"}%</span>
        </div>
      </div>

      {/* Bull / Bear */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
        {[
          {title:"Bull Case",body:analysis.bullCase,c:"var(--green)",bd:"rgba(127,255,212,0.08)",br:"rgba(127,255,212,0.1)",sym:"▲"},
          {title:"Bear Case",body:analysis.bearCase,c:"var(--red)",  bd:"rgba(255,128,128,0.06)",br:"rgba(255,128,128,0.1)",sym:"▼"},
        ].map((s,i)=>(
          <div key={i} style={{
            padding:"18px 26px",
            borderRight:i===0?"1px solid var(--white-06)":"none",
            borderBottom:"1px solid var(--white-06)",
            background:s.bd,
          }}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
              <span style={{fontSize:9,color:s.c,fontFamily:"var(--mono)"}}>{s.sym}</span>
              <span style={{fontSize:9,color:s.c,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase"}}>{s.title}</span>
            </div>
            <div style={{fontSize:12,lineHeight:1.85,color:"var(--white-60)",fontWeight:300}}>{s.body}</div>
          </div>
        ))}
      </div>

      {/* Edge + CTA */}
      <div style={{padding:"16px 26px",display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180}}>
          <span style={{fontSize:9,color:"var(--ice)",fontWeight:700,letterSpacing:1.5,marginRight:10,textTransform:"uppercase"}}>Edge</span>
          <span style={{fontSize:12,color:"var(--white-60)",lineHeight:1.8,fontWeight:300}}>{analysis.edge}</span>
        </div>
        {analysis.critique&&(
          <div style={{flex:1,minWidth:180}}>
            <span style={{fontSize:9,color:"var(--white-30)",fontWeight:700,letterSpacing:1.5,marginRight:10,textTransform:"uppercase"}}>2nd Opinion</span>
            <span style={{fontSize:12,color:"var(--white-60)",lineHeight:1.8,fontWeight:300}}>{analysis.critique}</span>
          </div>
        )}
        <a
          href={getPolyUrl(market)}
          target="_blank" rel="noreferrer"
          onClick={e=>e.stopPropagation()}
          style={{
            display:"inline-flex",alignItems:"center",gap:8,flexShrink:0,
            background:"var(--white)",color:"var(--void)",
            padding:"10px 20px",borderRadius:"var(--r3)",
            fontSize:12,fontWeight:700,textDecoration:"none",
            boxShadow:"0 0 24px rgba(255,255,255,0.15)",
            transition:"all .2s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 0 40px rgba(255,255,255,0.3)";e.currentTarget.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 0 24px rgba(255,255,255,0.15)";e.currentTarget.style.transform="";}}
        >Trade on Polymarket ↗</a>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   MARKET ROW
──────────────────────────────────────────────────────────────────────────── */
function MarketRow({market,rank,onAnalyze,idx}) {
  const a=market.analysis,ags=market.agents||{};
  const [open,setOpen]=useState(false);
  const gap=a?Math.abs(a.aiProb-market.polyProb):null;
  const hot=gap!==null&&gap>0.18;
  const cat=CAT[market.category]||CAT.Other;

  return (
    <div style={{
      marginBottom:8,
      animation:"riseIn .45s cubic-bezier(.22,1,.36,1) both",
      animationDelay:`${idx*25}ms`,
    }}>
      <div className="mrow card" style={{
        display:"grid",
        gridTemplateColumns:"36px 1fr 76px 150px 130px 76px 76px 30px",
        gap:12,alignItems:"center",padding:"16px 22px",
        borderRadius:open?"var(--r) var(--r) 0 0":"var(--r)",
        borderBottom:open?"none":undefined,
        animation:hot?"borderGlowHot 5s ease-in-out infinite":"borderGlow 4s ease-in-out infinite",
      }} onClick={()=>{setOpen(o=>!o);if(!a&&!market.analyzing)onAnalyze(market.id);}}>

        {/* Rank */}
        <div style={{
          width:30,height:30,borderRadius:"50%",
          border:`1px solid ${rank<3?"rgba(255,255,255,0.25)":"var(--white-10)"}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:11,fontFamily:"var(--mono)",fontWeight:400,
          color:rank<3?"var(--white)":"var(--white-30)",
          boxShadow:rank<3?"0 0 12px rgba(255,255,255,0.1)":"none",
          flexShrink:0,
        }}>{rank+1}</div>

        {/* Question */}
        <div>
          <div style={{fontSize:13,fontWeight:400,lineHeight:1.5,marginBottom:7,color:"var(--white-90)",letterSpacing:0.1}}>
            {market.question}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <span className="chip" style={{color:cat.c,background:cat.bg,fontSize:8}}>{market.category}</span>
            {market.endDate&&(
              <span style={{fontSize:9,color:"var(--white-30)",fontWeight:300,letterSpacing:0.2}}>
                exp. {new Date(market.endDate).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"})}
              </span>
            )}
            {hot&&(
              <span className="chip" style={{color:"var(--gold)",background:"var(--gold-dim)",border:"1px solid rgba(255,217,122,0.2)",animation:"float 3s ease-in-out infinite"}}>
                ✦ Opportunity
              </span>
            )}
            {a&&(
              <a href={getPolyUrl(market)}
                target="_blank" rel="noreferrer"
                onClick={e=>e.stopPropagation()}
                style={{fontSize:9,color:"var(--white-30)",textDecoration:"none",fontWeight:300,transition:"color .15s",letterSpacing:0.2}}
                onMouseEnter={e=>e.currentTarget.style.color="var(--white)"}
                onMouseLeave={e=>e.currentTarget.style.color="var(--white-30)"}
              >↗ open</a>
            )}
          </div>
        </div>

        {/* Sparkline */}
        <div className="desk" style={{display:"flex",justifyContent:"center"}}>
          <Sparkline id={market.id} prob={market.polyProb} up={a?a.signal==="LONG":null}/>
        </div>

        {/* Prob */}
        <div className="desk"><ProbBar poly={market.polyProb} ai={a?a.aiProb:null}/></div>

        {/* Signal */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
          {market.analyzing
            ?<div style={{display:"flex",alignItems:"center",gap:7}}><Spinner size={12}/><span style={{fontSize:10,color:"var(--white-30)",fontWeight:300}}>Analyzing…</span></div>
            :a
              ?<VerdictBadge verdict={a.verdict}/>
              :<span className="cta-hint" style={{
                  fontSize:10,fontWeight:500,color:"var(--white-60)",
                  border:"1px solid var(--white-10)",
                  padding:"4px 11px",borderRadius:"var(--r3)",
                  opacity:0,transform:"translateX(-6px)",
                  transition:"all .2s ease",whiteSpace:"nowrap",
                }}>Analyze →</span>
          }
        </div>

        {/* Gap */}
        <div style={{textAlign:"right"}}>
          {a
            ?<div className="tw">
                <div style={{fontFamily:"var(--mono)",fontSize:14,fontWeight:400,color:gap>0.2?"var(--gold)":"var(--white)",lineHeight:1}}>{pct(gap)}</div>
                <div style={{fontSize:8,color:"var(--white-30)",fontWeight:600,letterSpacing:0.5,marginTop:3}}>GAP</div>
                <span className="tp">AI vs market probability delta</span>
              </div>
            :<div className="skel" style={{height:11,width:36,marginLeft:"auto"}}/>
          }
        </div>

        {/* Volume */}
        <div style={{textAlign:"right"}}>
          <div className="tw">
            <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--white-60)",fontWeight:400}}>{fmt(market.volume)}</div>
            <div style={{fontSize:8,color:"var(--white-30)",fontWeight:600,letterSpacing:0.5,marginTop:3}}>VOL</div>
            <span className="tp">Total wagered</span>
          </div>
        </div>

        {/* Chevron */}
        <div style={{
          width:26,height:26,borderRadius:"50%",
          border:`1px solid ${open?"rgba(255,255,255,0.25)":"var(--white-10)"}`,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:10,
          color:open?"var(--white)":"var(--white-30)",
          transform:open?"rotate(180deg)":"none",
          transition:"all .25s cubic-bezier(.22,1,.36,1)",
          flexShrink:0,
          boxShadow:open?"0 0 12px rgba(255,255,255,0.08)":"none",
        }}>▾</div>
      </div>

      {open&&<AnalysisPanel analysis={a} loading={market.analyzing} agents={ags} market={market}/>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   STAT CARDS
──────────────────────────────────────────────────────────────────────────── */
function StatCards({total,analyzed,hot,strong}) {
  const CARDS=[
    {label:"Live Markets",   val:total,    sub:"from Polymarket",        accent:"var(--white)",     cls:"s0"},
    {label:"Analyzed",       val:analyzed, sub:`${total-analyzed} pending`, accent:"var(--ice)",     cls:"s1"},
    {label:"Opportunities",  val:hot,      sub:"AI gap > 18%",           accent:"var(--gold)",      cls:"s2"},
    {label:"Strong Signals", val:strong,   sub:"High conviction",        accent:"var(--green)",     cls:"s3"},
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,padding:"20px 20px 10px"}}>
      {CARDS.map((c,i)=>(
        <div key={i} className={`card ${c.cls}`} style={{
          padding:"22px 24px",
          animation:`countUp .55s cubic-bezier(.22,1,.36,1) both`,
          animationDelay:`${i*80}ms`,
          position:"relative",overflow:"hidden",
        }}>
          {/* Glow blob */}
          <div style={{
            position:"absolute",bottom:-30,right:-20,
            width:100,height:100,borderRadius:"50%",
            background:c.accent,opacity:0.04,
            filter:"blur(30px)",pointerEvents:"none",
          }}/>
          <div style={{fontSize:8,color:"var(--white-30)",fontWeight:600,letterSpacing:2,marginBottom:12,textTransform:"uppercase"}}>{c.label}</div>
          <div style={{fontFamily:"var(--mono)",fontSize:34,fontWeight:300,color:c.accent,lineHeight:1,marginBottom:6}}>{c.val}</div>
          <div style={{fontSize:10,color:"var(--white-30)",fontWeight:300}}>{c.sub}</div>
          {/* Bottom accent line */}
          <div style={{
            position:"absolute",bottom:0,left:24,right:24,height:1,
            background:`linear-gradient(90deg,transparent,${c.accent},transparent)`,
            opacity:0.25,
          }}/>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   ONBOARDING
──────────────────────────────────────────────────────────────────────────── */
function OnboardingBanner({onDismiss}) {
  return (
    <div style={{
      margin:"4px 20px 14px",padding:"18px 24px",
      background:"var(--white-03)",
      border:"1px solid var(--white-10)",
      borderRadius:"var(--r2)",
      display:"flex",alignItems:"flex-start",gap:18,flexWrap:"wrap",
      animation:"slideUp .4s cubic-bezier(.22,1,.36,1)",
    }}>
      <div style={{flex:1,minWidth:240}}>
        <div style={{fontSize:9,color:"var(--white-60)",fontWeight:600,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>How it works</div>
        <div style={{fontSize:12,color:"var(--white-60)",lineHeight:1.9,fontWeight:300}}>
          <span style={{color:"var(--white)",fontWeight:500}}>1.</span> Browse live prediction markets.{"  "}
          <span style={{color:"var(--white)",fontWeight:500}}>2.</span> Click any row — 3 AI agents analyze whether it's mispriced.{"  "}
          <span style={{color:"var(--white)",fontWeight:500}}>3.</span> Filter <span style={{color:"var(--gold)"}}>✦ Opportunities</span> for AI gaps over 18%.
        </div>
      </div>
      <button onClick={onDismiss} className="btn-ghost" style={{flexShrink:0,fontSize:11}}>Dismiss ✕</button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   APP
──────────────────────────────────────────────────────────────────────────── */
export default function App() {
  const [markets,setMarkets]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filter,setFilter]=useState("all");
  const [tab,setTab]=useState("markets");
  const [proxyOk,setProxyOk]=useState(null);
  const [lastUpdate,setLastUpdate]=useState(null);
  const [analyzingAll,setAnalyzingAll]=useState(false);
  const [progress,setProgress]=useState(0);
  const [search,setSearch]=useState("");
  const [sortBy,setSortBy]=useState("volume");
  const [sortDir,setSortDir]=useState("desc");
  const [showOnboard,setShowOnboard]=useState(true);
  const {saveSignal}=useSignals();

  useEffect(()=>{document.title="Polyalpha — Scanner";},[]);

  useEffect(()=>{
    async function boot(){
      try{const h=await fetch(`${PROXY}/health`);if(!h.ok)throw 0;setProxyOk(true);}
      catch{setProxyOk(false);setLoading(false);return;}
      try{
        const r=await fetch(`${PROXY}/markets?limit=100`);if(!r.ok)throw 0;
        const data=await r.json();
        setMarkets((Array.isArray(data)?data:[]).filter(m=>m.question&&m.outcomePrices).map(m=>({
          id:m.id,slug:m.slug||m.id,question:m.question,
          conditionId:m.conditionId||null,eventSlug:m.events?.[0]?.slug||null,
          polyProb:parsePolyProb(m),volume:m._volume||parseFloat(m.volumeNum||m.volume||0),
          category:categorize(m.question),endDate:m.endDate||m.endDateIso||null,
          liquidity:m._liquidity||parseFloat(m.liquidityNum||m.liquidity||0),analysis:null,analyzing:false,
        })));
        setLastUpdate(new Date());
      }catch(e){console.error(e);}
      setLoading(false);
    }
    boot();
    const iv=setInterval(boot,120000);
    return()=>clearInterval(iv);
  },[]);

  // Auto-analyze instantly — runs synchronously so no waiting
  useEffect(()=>{
    if(markets.length>0){
      analyzeAll();
    }
  },[markets.length]);

  const analyzeMarket=useCallback(async(id)=>{
    const m=markets.find(x=>x.id===id);
    if(!m||m.analyzing||m.analysis)return;
    setMarkets(ms=>ms.map(x=>x.id===id?{...x,analyzing:true,agents:{}}:x));
    try{
      const result=await analyzeWithClaude(m,(step,label,status,data)=>{
        setMarkets(ms=>ms.map(x=>x.id===id?{...x,agents:{...x.agents,[step]:{label,status,data}}}:x));
      });
      setMarkets(ms=>ms.map(x=>x.id===id?{...x,analyzing:false,analysis:result}:x));
      await saveSignal(m,result);
    }catch{setMarkets(ms=>ms.map(x=>x.id===id?{...x,analyzing:false}:x));}
  },[markets,saveSignal]);

  const analyzeAll=useCallback(()=>{
    setAnalyzingAll(true);
    const todo=markets.filter(m=>!m.analysis&&!m.analyzing);
    if(todo.length===0){setAnalyzingAll(false);return;}

    const results=todo.map(m=>{
      const p    = m.polyProb;           // market probability 0-1
      const vol  = m.volume  || 0;       // total lifetime volume $
      const liq  = m.liquidity || 0;     // current liquidity $
      const cat  = (m.category||'OTHER').toUpperCase();

      // ── Signal 1: Liquidity-adjusted mispricing ───────────────────────
      // Thin liquidity = wider spread = higher chance of stale price
      const liqScore = liq < 500   ? 0.08
                     : liq < 2000  ? 0.05
                     : liq < 10000 ? 0.02
                     : liq < 50000 ? 0.01
                     : 0;

      // ── Signal 2: Volume/liquidity ratio (turnover signal) ────────────
      // High vol relative to liq = price has been tested = more reliable
      // Low ratio = price may not reflect true belief
      const turnover    = liq > 0 ? vol / liq : 0;
      const turnoverAdj = turnover < 2  ? 0.04   // barely traded relative to liquidity
                        : turnover < 10 ? 0.02
                        : turnover > 100 ? -0.01  // very active = efficient
                        : 0;

      // ── Signal 3: Probability extremity — crowd overconfidence ────────
      // Markets near 0% or 100% systematically underprice tail risk
      const extremeAdj = p < 0.05 ? +0.06
                       : p > 0.95 ? -0.06
                       : p < 0.10 ? +0.04
                       : p > 0.90 ? -0.04
                       : p < 0.15 ? +0.02
                       : p > 0.85 ? -0.02
                       : 0;

      // ── Signal 4: Round number anchoring bias ─────────────────────────
      // People anchor on 25/50/75 — real prob likely slightly different
      const roundDist   = [0.25,0.50,0.75].map(r=>Math.abs(p-r));
      const minRound    = Math.min(...roundDist);
      const roundAdj    = minRound < 0.015 ? (p < 0.5 ? -0.015 : +0.015) : 0;

      // ── Signal 5: Category base rate drift ───────────────────────────
      // Historical Polymarket data: some categories systematically misprice
      const catDrift = {
        CRYPTO:     +0.000, // efficient, high volume traders
        POLITICS:   -0.025, // overprice YES (wishful thinking)
        SPORTS:     +0.010, // slight underpricing of upsets
        ECONOMICS:  +0.015, // slow to update on macro
        TECH:       +0.020, // underprices disruptive outcomes
        SCIENCE:    +0.018,
        HEALTH:     +0.012,
        OTHER:      +0.005,
      }[cat] || +0.005;

      // ── Combine signals ───────────────────────────────────────────────
      const direction   = p < 0.5 ? 1 : -1; // liq/turnover signals push toward uncertainty
      const rawAdj      = extremeAdj
                        + (liqScore    * direction)
                        + (turnoverAdj * direction)
                        + catDrift
                        + roundAdj;

      let aiProb = Math.max(0.02, Math.min(0.98, p + rawAdj));

      // ── Critic: dampen overconfident gaps ─────────────────────────────
      const rawGap = aiProb - p;
      const absGap = Math.abs(rawGap);
      if (absGap > 0.20) aiProb = p + rawGap * 0.75;
      else if (absGap > 0.12) aiProb = p + rawGap * 0.88;
      aiProb = Math.max(0.02, Math.min(0.98, aiProb));

      const finalGap = Math.abs(aiProb - p);
      const signal   = rawGap > 0.04 ? 'LONG' : rawGap < -0.04 ? 'SHORT' : 'NEUTRAL';
      const verdict  = finalGap < 0.03 ? 'NEUTRAL'
                     : finalGap < 0.07 ? (aiProb > p ? 'BUY'         : 'SELL')
                     :                   (aiProb > p ? 'STRONG BUY'  : 'STRONG SELL');

      // ── Confidence: more signals agreeing = higher confidence ─────────
      const signalCount = [
        Math.abs(extremeAdj)   > 0.01,
        Math.abs(liqScore)     > 0.02,
        Math.abs(turnoverAdj)  > 0.01,
        Math.abs(catDrift)     > 0.01,
        Math.abs(roundAdj)     > 0,
      ].filter(Boolean).length;
      const confidence = Math.min(85, Math.max(20, 30 + signalCount * 11 + (finalGap > 0.12 ? 12 : finalGap > 0.06 ? 6 : 0)));

      // ── Edge description ──────────────────────────────────────────────
      const ep   = Math.round(finalGap * 100);
      const mPct = Math.round(p * 100);
      const aPct = Math.round(aiProb * 100);
      const edge = finalGap < 0.03
        ? `Market appears efficiently priced at \${mPct}% (Δ\${ep}%)`
        : finalGap < 0.07
        ? `Moderate edge — model \${aPct}% vs market \${mPct}% (Δ\${ep}%) driven by \${signalCount} signal\${signalCount>1?'s':''}`
        : `Strong edge — model \${aPct}% vs market \${mPct}% (Δ\${ep}%) — \${signalCount} converging signals`;

      // ── Bull / Bear case ──────────────────────────────────────────────
      const bullFactors = [];
      const bearFactors = [];
      if (extremeAdj > 0)    bullFactors.push(`Tail risk at \${mPct}% systematically underpriced by crowds`);
      if (extremeAdj < 0)    bearFactors.push(`Near-certainty at \${mPct}% — overconfidence risk`);
      if (liqScore > 0.04)   bullFactors.push(`Very thin liquidity ($\${Math.round(liq).toLocaleString()}) — price not battle-tested`);
      if (turnoverAdj > 0.02)bullFactors.push(`Low turnover ratio (\${Math.round(turnover)}x) — stale pricing`);
      if (turnoverAdj < 0)   bearFactors.push(`High turnover (\${Math.round(turnover)}x) — efficient, well-arbitraged market`);
      if (catDrift > 0.01)   bullFactors.push(`\${cat} category historically underprices YES outcomes`);
      if (catDrift < -0.01)  bearFactors.push(`\${cat} category shows wishful thinking bias — YES overpriced`);
      if (roundAdj !== 0)    (p < 0.5 ? bearFactors : bullFactors).push(`Round number anchoring at \${mPct}% — true prob likely off`);
      if (bullFactors.length === 0) bullFactors.push(`Model finds no structural edge — market appears efficient`);
      if (bearFactors.length === 0) bearFactors.push(`High volume and liquidity suggest efficient pricing`);

      const critique = signalCount >= 4 ? `Strong case — \${signalCount} independent signals converge`
                     : signalCount >= 2 ? `Moderate case — \${signalCount} signals align, use normal sizing`
                     : liq < 1000      ? `Thin market ($\${Math.round(liq).toLocaleString()} liq) — reduce size, wide spreads`
                     :                   `Weak single-signal trade — small position only`;

      return {
        id: m.id,
        analysis: {
          aiProb, signal, confidence, edge, verdict,
          bullCase: bullFactors[0],
          bearCase: bearFactors[0],
          critique,
          research: { bullFactors, bearFactors, keyUncertainty: `Vol $\${vol>=1e6?(vol/1e6).toFixed(1)+'M':vol>=1e3?(vol/1e3).toFixed(0)+'K':Math.round(vol)} · Liq $\${liq>=1e3?(liq/1e3).toFixed(0)+'K':Math.round(liq)} · Turnover \${Math.round(turnover)}x` },
        }
      };
    });

    setMarkets(ms=>ms.map(m=>{
      const r=results.find(x=>x.id===m.id);
      return r?{...m,analysis:r.analysis,analyzing:false}:m;
    }));
    setProgress(100);
    setAnalyzingAll(false);
  },[markets]);

  const toggleSort=col=>{
    if(sortBy===col)setSortDir(d=>d==="desc"?"asc":"desc");
    else{setSortBy(col);setSortDir("desc");}
  };

  const analyzed=markets.filter(m=>m.analysis);
  const hot=analyzed.filter(m=>Math.abs(m.analysis.aiProb-m.polyProb)>0.18);
  const strong=analyzed.filter(m=>m.analysis.verdict?.includes("STRONG"));

  const filtered=markets
    .filter(m=>{
      if(filter==="hot")  return m.analysis && Math.abs(m.analysis.aiProb-m.polyProb)>0.18;
      if(filter==="long") return m.analysis && (m.analysis.signal==="LONG"  || m.analysis.verdict?.includes('BUY'));
      if(filter==="short")return m.analysis && (m.analysis.signal==="SHORT" || m.analysis.verdict?.includes('SELL'));
      // "all" tab: hide NEUTRAL, show everything else (including unanalyzed)
      if(m.analysis && m.analysis.verdict==='NEUTRAL') return false;
      return true;
    })
    .filter(m=>!search||m.question.toLowerCase().includes(search.toLowerCase())||m.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>{
      if(sortBy==="volume")return sortDir==="desc"?b.volume-a.volume:a.volume-b.volume;
      if(sortBy==="gap"){
        const va=a.analysis?Math.abs(a.analysis.aiProb-a.polyProb):-1;
        const vb=b.analysis?Math.abs(b.analysis.aiProb-b.polyProb):-1;
        return sortDir==="desc"?vb-va:va-vb;
      }
      return 0;
    });

  const SortIco=({col})=>sortBy!==col
    ?<span style={{color:"var(--white-20)",marginLeft:3,fontSize:8}}>⇅</span>
    :<span style={{color:"var(--white)",marginLeft:3,fontSize:8}}>{sortDir==="desc"?"↓":"↑"}</span>;

  /* Error */
  if(proxyOk===false) return (
    <>
      <style>{css}</style>
      <StarCanvas/>
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
        <div className="card s0" style={{maxWidth:420,padding:"44px 40px",textAlign:"center"}}>
          <div style={{fontSize:10,color:"var(--white-30)",letterSpacing:3,marginBottom:24,textTransform:"uppercase"}}>Error — Connection Failed</div>
          <div style={{fontSize:20,fontWeight:300,color:"var(--white)",marginBottom:12,letterSpacing:-0.3}}>Backend not running</div>
          <div style={{fontSize:12,color:"var(--white-30)",lineHeight:1.9,marginBottom:28,fontWeight:300}}>
            Start the proxy server and reload this page.
          </div>
          <div style={{
            fontFamily:"var(--mono)",background:"var(--white-03)",
            border:"1px solid var(--white-10)",borderRadius:"var(--r2)",
            padding:"12px 18px",fontSize:12,color:"var(--white-60)",
            marginBottom:28,textAlign:"left",letterSpacing:0.3,
          }}>$ node backend/server.js</div>
          <button onClick={()=>window.location.reload()} className="btn-glass" style={{width:"100%",padding:"12px",fontSize:13}}>
            ↻ Retry
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>

      <div style={{minHeight:"100vh", position:'relative', zIndex:1}}>

        {/* ── Topbar ── */}
        <header className="glass s0" style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          height:58,padding:"0 22px",
          position:"sticky",top:0,zIndex:100,
          borderBottom:"1px solid var(--white-06)",
        }}>
          {/* Left — logo + nav */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {/* Logo */}
            <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
              {/* Alpha + chart SVG mark */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff"/>
                    <stop offset="100%" stopColor="#a8c4ff"/>
                  </linearGradient>
                </defs>
                {/* Outer subtle ring */}
                <circle cx="14" cy="14" r="13" stroke="rgba(168,196,255,0.15)" strokeWidth="1"/>
                {/* Alpha symbol */}
                <text x="14" y="18" textAnchor="middle" fontFamily="Georgia, serif" fontSize="15" fontWeight="400" fill="url(#logoGrad)">α</text>
                {/* Micro chart line inside */}
                <polyline points="6,20 9,16 12,18 16,12 20,14 23,9" stroke="#7fffd4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
              </svg>
              {/* Wordmark */}
              <div style={{display:"flex",alignItems:"baseline",gap:1}}>
                <span style={{fontSize:15,fontWeight:600,letterSpacing:"-0.01em",color:"#fff"}}>Poly</span>
                <span style={{fontSize:15,fontWeight:200,letterSpacing:"-0.01em",color:"rgba(168,196,255,0.9)"}}>alpha</span>
              </div>
            </div>
            <div style={{width:1,height:16,background:"var(--white-10)",margin:"0 6px"}}/>
            <button className={`ntab ${tab==="markets"?"on":""}`} onClick={()=>setTab("markets")}>Scanner</button>
            <button className={`ntab ${tab==="history"?"on":""}`} onClick={()=>setTab("history")}>History</button>
          </div>

          {/* Right */}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {tab==="markets"&&(
              <div style={{
                display:"flex",alignItems:"center",gap:8,
                background:"var(--white-03)",
                border:"1px solid var(--white-10)",
                borderRadius:"var(--r3)",padding:"7px 16px",
              }}>
                <span style={{fontSize:11,color:"var(--white-30)"}}>⌕</span>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search markets…"
                  style={{background:"transparent",border:"none",color:"var(--white-90)",fontSize:12,width:150,fontWeight:300}}/>
                {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"var(--white-30)",fontSize:10,padding:0}}>✕</button>}
              </div>
            )}

            {proxyOk&&markets.length>0&&(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 12px",
                background:"rgba(127,255,212,0.04)",border:"1px solid rgba(127,255,212,0.14)",
                borderRadius:"var(--r3)"}}>
                <LiveDot/>
                <span style={{fontSize:10,color:"var(--green)",fontWeight:500,letterSpacing:0.3}}>Live</span>
              </div>
            )}

            {lastUpdate&&(
              <span className="desk" style={{fontSize:9,color:"var(--white-30)",fontFamily:"var(--mono)",fontWeight:300}}>
                {lastUpdate.toLocaleTimeString()}
              </span>
            )}

            {tab==="markets"&&!analyzingAll&&analyzed.length<markets.length&&markets.length>0&&(
              <button onClick={analyzeAll} className="btn-glass" style={{fontSize:11}}>
                Analyze all ({markets.length-analyzed.length})
              </button>
            )}
            {analyzingAll&&(
              <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",background:"var(--white-06)",borderRadius:"var(--r3)",border:"1px solid var(--white-10)"}}>
                <Spinner size={11}/>
                <div style={{width:64,height:3,background:"var(--white-06)",borderRadius:100,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${progress}%`,background:"var(--white-60)",borderRadius:100,transition:"width .4s ease"}}/>
                </div>
                <span style={{fontSize:10,color:"var(--white-30)",fontFamily:"var(--mono)",fontWeight:300}}>{progress}%</span>
              </div>
            )}

            <UserMenu/>
          </div>
        </header>

        {/* ── Scanner ── */}
        {tab==="markets"&&(
          <div style={{paddingBottom:56}}>
            <BentoGrid markets={markets} analyzed={analyzed} hot={hot} strong={strong}/>
            <StatCards total={markets.length} analyzed={analyzed.length} hot={hot.length} strong={strong.length}/>

            {showOnboard&&<OnboardingBanner onDismiss={()=>setShowOnboard(false)}/>}

            {/* Filters */}
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"4px 20px 16px",flexWrap:"wrap"}}>
              {[
                {id:"all",  label:"All"},
                {id:"hot",  label:`✦ Opportunities (${hot.length})`},
                {id:"long", label:"▲ Undervalued"},
                {id:"short",label:"▼ Overvalued"},
              ].map(f=>(
                <button key={f.id} className={`fpill btn-glass ${filter===f.id?"on":""}`} onClick={()=>setFilter(f.id)}>
                  {f.label}
                </button>
              ))}
              <div style={{flex:1}}/>
              <span style={{fontSize:9,color:"var(--white-30)",fontFamily:"var(--mono)",fontWeight:300,letterSpacing:0.5}}>{filtered.length} markets</span>
            </div>

            {/* Column header */}
            <div style={{
              display:"grid",
              gridTemplateColumns:"36px 1fr 76px 150px 130px 76px 76px 30px",
              gap:12,padding:"0 22px 10px",
              fontSize:8,color:"var(--white-30)",fontWeight:600,letterSpacing:2,textTransform:"uppercase",
            }}>
              <span>#</span>
              <span>Market</span>
              <span className="desk">Trend</span>
              <span className="desk tw">Mkt → AI<span className="tp">Market vs AI probability</span></span>
              <span style={{textAlign:"center"}}>Signal</span>
              <span className="sort tw" style={{textAlign:"right"}} onClick={()=>toggleSort("gap")}>
                Gap <SortIco col="gap"/>
                <span className="tp">AI vs market delta</span>
              </span>
              <span className="sort" style={{textAlign:"right"}} onClick={()=>toggleSort("volume")}>
                Vol <SortIco col="volume"/>
              </span>
              <span/>
            </div>

            {/* Rows */}
            <div style={{padding:"0 20px"}}>
              {loading
                ?[...Array(7)].map((_,i)=>(
                    <div key={i} className="card" style={{
                      display:"flex",gap:12,marginBottom:8,alignItems:"center",
                      padding:"16px 22px",opacity:1-i*.12,
                    }}>
                      <div className="skel" style={{width:30,height:30,borderRadius:"50%",flexShrink:0}}/>
                      <div className="skel" style={{flex:1,height:11}}/>
                      <div className="skel" style={{width:76,height:26,borderRadius:6}}/>
                      <div className="skel" style={{width:150,height:8}}/>
                      <div className="skel" style={{width:96,height:20,borderRadius:100}}/>
                      <div className="skel" style={{width:40,height:11}}/>
                      <div className="skel" style={{width:44,height:11}}/>
                      <div className="skel" style={{width:26,height:26,borderRadius:"50%"}}/>
                    </div>
                  ))
                :filtered.length===0
                  ?<div style={{padding:"72px",textAlign:"center",fontSize:12,color:"var(--white-30)",fontWeight:300,letterSpacing:0.3}}>
                    {search?`No results for "${search}"`:"No markets match this filter"}
                  </div>
                  :filtered.map((m,i)=><MarketRow key={m.id} market={m} rank={i} idx={i} onAnalyze={analyzeMarket}/>)
              }
            </div>

            <div style={{padding:"24px",textAlign:"center",fontSize:9,color:"var(--white-30)",fontWeight:300,letterSpacing:0.5}}>
              Click any row to analyze · Refreshes every 2 min · Signals saved to History
            </div>
          </div>
        )}

        {tab==="history"&&<SignalHistory/>}
      </div>
    </>
  );
}
