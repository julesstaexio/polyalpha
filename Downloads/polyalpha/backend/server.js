const http = require("http");
const https = require("https");
const url = require("url");

const PORT = 3001;

// ─── DUAL MODE ───────────────────────────────────────────────────────────────
// prod:  set ANTHROPIC_API_KEY env var → calls api.anthropic.com
// dev:   set DEV_MODE=true             → calls Ricky's CLIProxyAPI on localhost:8317
const DEV_MODE = process.env.DEV_MODE === "true";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

if (DEV_MODE) {
  console.log("  🔧 DEV MODE — proxying Claude through CLIProxyAPI @ localhost:8317");
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fetchUpstream(targetHost, targetPath) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: targetHost, path: targetPath, method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PolyAlpha/2.0)", Accept: "application/json" } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch { resolve({ status: res.statusCode, body: data }); } });
      }
    );
    req.on("error", reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error("Timeout")); });
    req.end();
  });
}

// Calls Claude — supports both prod (Anthropic API) and dev (CLIProxyAPI OpenAI-compat)
function callClaude(messages, maxTokens = 1000) {
  return new Promise((resolve, reject) => {
    if (DEV_MODE) {
      // CLIProxyAPI — OpenAI-compatible format on localhost:8317
      const body = JSON.stringify({
        model: "claude-max",
        max_tokens: maxTokens,
        messages,
      });
      const req = http.request(
        { hostname: "localhost", port: 8317, path: "/v1/chat/completions", method: "POST",
          headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              // Normalize to Anthropic-style response
              const text = parsed.choices?.[0]?.message?.content || "";
              resolve({ status: res.statusCode, text });
            } catch { resolve({ status: res.statusCode, text: data }); }
          });
        }
      );
      req.on("error", reject);
      req.setTimeout(60000, () => { req.destroy(); reject(new Error("Timeout")); });
      req.write(body);
      req.end();
    } else {
      // Prod — Anthropic API
      const body = JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages,
      });
      const req = https.request(
        { hostname: "api.anthropic.com", path: "/v1/messages", method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01", "Content-Length": Buffer.byteLength(body) } },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              const text = parsed.content?.[0]?.text || "";
              resolve({ status: res.statusCode, text });
            } catch { resolve({ status: res.statusCode, text: data }); }
          });
        }
      );
      req.on("error", reject);
      req.setTimeout(60000, () => { req.destroy(); reject(new Error("Timeout")); });
      req.write(body);
      req.end();
    }
  });
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
  });
}

function parseJSON(text) {
  if (!text) return null;
  // Try direct parse first
  try { return JSON.parse(text.trim()); } catch {}
  // Strip markdown fences
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); } catch {}
  // Extract first {...} block
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return null;
}

// SSE helper
function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─── QUANTITATIVE SCORING ENGINE ─────────────────────────────────────────────
// No LLM — pure algorithmic signal based on market microstructure
//
// Signals used:
//  1. Probability extremity   — markets near 0% or 100% are sticky, fade extremes
//  2. Volume signal           — low volume = wider bid/ask = more mispricing
//  3. Time decay              — close to resolution = higher confidence
//  4. Category base rates     — historical mispricing by category
//  5. Round number bias       — markets priced at 25/50/75% are anchored by humans
//  6. Momentum proxy          — extreme prob + low vol = likely stale price

const CATEGORY_BIAS = {
  CRYPTO:    { drift: 0.04,  volatility: 0.18 },  // high vol, often overpriced hype
  POLITICS:  { drift: -0.02, volatility: 0.12 },  // slight overconfidence in favorites
  ECONOMICS: { drift: 0.01,  volatility: 0.08 },  // fairly priced, macro is efficient
  TECH:      { drift: 0.03,  volatility: 0.14 },  // hype premium on positive outcomes
  SPORTS:    { drift: 0.00,  volatility: 0.10 },  // efficient, bookmakers arb quickly
  DEFAULT:   { drift: 0.01,  volatility: 0.10 },
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function runAgentPipeline(market, sseRes) {
  const p    = market.polyProb;
  const vol  = market.volume || 0;
  const cat  = (market.category || 'DEFAULT').toUpperCase();
  const bias = CATEGORY_BIAS[cat] || CATEGORY_BIAS.DEFAULT;

  // Signal 1: Extremity fade
  let extremityAdj = 0;
  if (p < 0.10)      extremityAdj = +0.04;
  else if (p > 0.90) extremityAdj = -0.04;
  else if (p < 0.20) extremityAdj = +0.02;
  else if (p > 0.80) extremityAdj = -0.02;

  // Signal 2: Volume (low vol = stale price)
  const volScore = vol < 1000 ? 0.06 : vol < 5000 ? 0.04 : vol < 20000 ? 0.02 : vol < 100000 ? 0.01 : 0;

  // Signal 3: Round number bias
  const roundBias = [0.25, 0.50, 0.75].some(r => Math.abs(p - r) < 0.02) ? 0.02 : 0;

  // Signal 4: Time decay
  let timeAdj = 0;
  if (market.endDate) {
    const daysLeft = (new Date(market.endDate) - Date.now()) / 86400000;
    timeAdj = daysLeft < 3 ? 0 : daysLeft < 14 ? 0.01 : daysLeft < 60 ? 0.02 : 0.03;
  }

  const totalAdj = extremityAdj + (volScore * (p < 0.5 ? 1 : -1)) + bias.drift + timeAdj;
  let aiProb = Math.max(0.02, Math.min(0.98, p + totalAdj));
  if (roundBias > 0) aiProb = Math.max(0.02, Math.min(0.98, p < 0.5 ? aiProb - 0.015 : aiProb + 0.015));

  const rawGap  = aiProb - p;
  const absGap  = Math.abs(rawGap);
  const signalCount = [extremityAdj !== 0, volScore > 0.02, roundBias > 0, Math.abs(bias.drift) > 0.02].filter(Boolean).length;
  const confidence  = Math.min(88, Math.max(25, 35 + signalCount * 12 + (absGap > 0.12 ? 15 : absGap > 0.06 ? 8 : 0)));
  const signal = rawGap > 0.04 ? 'LONG' : rawGap < -0.04 ? 'SHORT' : 'NEUTRAL';

  // Critic adjustment
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
  if (vol < 5000) bullFactors.push(`Low liquidity ($${vol.toLocaleString()}) — price likely stale`);
  if (bias.drift > 0.02) bullFactors.push(`${cat} historically underprices positive outcomes`);
  if (roundBias > 0) bearFactors.push('Round number anchoring bias detected');
  if (extremityAdj > 0) bullFactors.push('Tail risk underpriced by crowd');
  if (extremityAdj < 0) bearFactors.push('Overconfidence in near-certain outcome');
  if (bullFactors.length === 0) bullFactors.push('Base rate suggests fair pricing');
  if (bearFactors.length === 0) bearFactors.push('Volume and structure suggest efficient pricing');

  const research = {
    bullFactors,
    bearFactors,
    keyUncertainty: vol < 2000
      ? 'Thin order book — single large trade could move price significantly'
      : p > 0.7 || p < 0.3
      ? 'Probability at extreme — small new information could cause sharp revision'
      : 'Market is liquid and near 50% — information edge required to beat',
  };

  const critique = vol < 1000
    ? 'Very thin market — treat signal with caution'
    : absGap > 0.15
    ? 'Large gap — verify market has not moved recently before trading'
    : signalCount >= 3
    ? 'Multiple converging signals strengthen the case'
    : 'Single-signal trade — use small position size';

  // Send SSE events instantly
  sseWrite(sseRes, 'agent', { step: 1, label: 'RESEARCHER', status: 'running' });
  sseWrite(sseRes, 'agent', { step: 1, label: 'RESEARCHER', status: 'done', data: research });
  sseWrite(sseRes, 'agent', { step: 2, label: 'ANALYST', status: 'running' });
  sseWrite(sseRes, 'agent', { step: 2, label: 'ANALYST', status: 'done', data: { aiProb, signal, confidence, edge, bullCase: bullFactors[0], bearCase: bearFactors[0] } });
  sseWrite(sseRes, 'agent', { step: 3, label: 'CRITIC', status: 'running' });
  sseWrite(sseRes, 'agent', { step: 3, label: 'CRITIC', status: 'done', data: { verdict, finalProb, adjustment: 'agreed', critique } });

  return Promise.resolve({ aiProb: finalProb, signal, confidence, edge, bullCase: bullFactors[0], bearCase: bearFactors[0], verdict, critique, research });
}


// ── Market quality filter ────────────────────────────────────────────────────
const CRYPTO_PRICE_PATTERNS = [
  // Price targets with numbers
  /\$[\d,\.]+[kKmMbB]?/,
  /\d+[kK]\s*(by|before|end|eoy|eom)/i,
  /reach\s+\$?[\d,]+/i,
  /above\s+\$?[\d,]+/i,
  /below\s+\$?[\d,]+/i,
  /exceed\s+\$?[\d,]+/i,
  /hit\s+\$?[\d,]+/i,
  /break\s+\$?[\d,]+/i,
  /cross\s+\$?[\d,]+/i,
  /over\s+\$?[\d,]+/i,
  /under\s+\$?[\d,]+/i,
  // Short-term crypto price
  /will (btc|eth|sol|bnb|xrp|doge|shib|matic|avax|link|ada|dot|ltc|atom|near|apt|sui|pepe|wif|bonk).{0,40}(by|before|end|close|open|eod|tonight|today|this week|next week|this month)/i,
  /(btc|eth|sol|bnb|xrp|doge|shib).{0,30}(price|pump|dump|moon|crash|surge|drop|fall|rise|rally|ath|all.time)/i,
  // Generic price/timing patterns
  /price.{0,15}(end of|by|before|this|next|tonight|today)/i,
  /(end of day|eod|tonight|today|this week|next week|this month|end of month).{0,30}(price|trade|close|open|be at|reach)/i,
  // Technical trading patterns
  /candle|wick|rsi|macd|support|resistance|breakout|fibonacci/i,
  // Crypto index/dominance
  /crypto.{0,20}(dominance|index|market cap|total market)/i,
  // "up or down" style
  /up or down/i,
  /higher or lower/i,
  /green or red/i,
  /(bitcoin|ethereum|solana|crypto).{0,30}(next hour|next day|24 hour|48 hour|72 hour|this week|next week|end of)/i,
];
function isLowQualityMarket(q) {
  if (!q) return true;
  return CRYPTO_PRICE_PATTERNS.some(p => p.test(q));
}

// ─── HTTP SERVER ─────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const { pathname, query } = url.parse(req.url, true);
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`);

  // ── GET /markets ──────────────────────────────────────────────────────────
  if (pathname === "/markets") {
    res.setHeader("Content-Type", "application/json");
    try {
      // Single fast request — max 200 markets, filter noise, return instantly
      const maxMarkets = Math.min(parseInt(query.limit) || 100, 200);
      const { status, body } = await fetchUpstream(
        "gamma-api.polymarket.com",
        "/markets?limit=200&offset=0&active=true&closed=false&order=volume&ascending=false"
      );
      if (status !== 200 || !Array.isArray(body)) {
        res.writeHead(status); res.end(JSON.stringify({ error: "Upstream error" })); return;
      }
      const allMarkets = body
        .filter(m => !isLowQualityMarket(m.question))
        .map(m => ({
          ...m,
          // Normalize volume to the largest available figure
          _volume: Math.max(
            parseFloat(m.volumeNum  || 0),
            parseFloat(m.volume     || 0),
            parseFloat(m.volume1yr  || 0),
            parseFloat(m.volumeClob || 0),
          ),
          _liquidity: parseFloat(m.liquidityNum || m.liquidity || 0),
          _prob: (() => {
            try { return parseFloat(JSON.parse(m.outcomePrices||'[]')[0]) || 0.5; }
            catch { return 0.5; }
          })(),
        }));
      res.writeHead(200);
      res.end(JSON.stringify(allMarkets.slice(0, maxMarkets)));
    } catch (err) {
      res.writeHead(502);
      res.end(JSON.stringify({ error: "Upstream error", detail: err.message }));
    }
    return;
  }

  // ── POST /analyze (SSE instant) ───────────────────────────────────────────
  if (pathname === "/analyze" && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", async () => {
      try {
        const { market } = JSON.parse(body);
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        });
        const result = await runAgentPipeline(market, res);
        sseWrite(res, "result", result);
        res.end();
      } catch (err) {
        console.error("/analyze error:", err);
        sseWrite(res, "error", { message: err.message });
        res.end();
      }
    });
    return;
  }

  // ── GET /health ───────────────────────────────────────────────────────────
  if (pathname === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, engine: "quantitative-algo", port: PORT }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`\n  ◈ Polyalpha backend — port ${PORT}`);
  console.log(`  Engine: quantitative-algo (instant, no LLM)\n`);
});
