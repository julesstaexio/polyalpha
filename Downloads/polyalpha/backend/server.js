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
} else if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "") {
  console.warn("  ⚠  ANTHROPIC_API_KEY not set — /analyze will fail in prod mode");
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

// ─── MULTI-AGENT PIPELINE ────────────────────────────────────────────────────
// Agent 1 — Researcher: extracts key facts & framing
// Agent 2 — Analyst:    estimates true probability with reasoning
// Agent 3 — Critic:     challenges the estimate, gives final verdict

async function runAgentPipeline(market, sseRes) {
  const fmt = n => n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n/1e3).toFixed(0)}K` : `$${n}`;
  const marketContext = `Question: "${market.question}"
Current market probability: ${Math.round(market.polyProb * 100)}%
Volume: ${fmt(market.volume || 0)}
Category: ${market.category || "Unknown"}
${market.endDate ? `Resolves: ${market.endDate}` : ""}`;

  // ── Agent 1: Researcher ───────────────────────────────────────────────────
  sseWrite(sseRes, "agent", { step: 1, label: "RESEARCHER", status: "running" });

  const researcherPrompt = `You are a research agent for a prediction market. Your job is to identify the key factors that determine whether this event resolves YES or NO.

${marketContext}

List the 3-5 most important factors that would move this probability up or down. Be concise and factual.
Respond in JSON only:
{
  "bullFactors": ["factor1", "factor2", "factor3"],
  "bearFactors": ["factor1", "factor2", "factor3"],
  "keyUncertainty": "single most important unknown"
}`;

  const r1 = await callClaude([{ role: "user", content: researcherPrompt }], 600);
  console.log("RESEARCHER RAW:", JSON.stringify(r1.text?.slice(0, 500)));
  const research = parseJSON(r1.text);
  if (!research) throw new Error("Researcher agent failed to return valid JSON");

  sseWrite(sseRes, "agent", { step: 1, label: "RESEARCHER", status: "done", data: research });

  // ── Agent 2: Analyst ──────────────────────────────────────────────────────
  sseWrite(sseRes, "agent", { step: 2, label: "ANALYST", status: "running" });

  const analystPrompt = `You are a quantitative analyst for a prediction market. Using the research below, estimate the true probability and trading signal.

${marketContext}

Research findings:
Bull factors: ${research.bullFactors.join(", ")}
Bear factors: ${research.bearFactors.join(", ")}
Key uncertainty: ${research.keyUncertainty}

Apply Bayesian reasoning. The market currently prices this at ${Math.round(market.polyProb * 100)}%. Is it mispriced?

Respond in JSON only:
{
  "aiProb": <0-1>,
  "signal": "<LONG|SHORT|NEUTRAL>",
  "confidence": <1-99>,
  "edge": "<1 sentence why mispriced or fairly priced>",
  "bullCase": "<1 sentence>",
  "bearCase": "<1 sentence>"
}`;

  const r2 = await callClaude([{ role: "user", content: analystPrompt }], 600);
  const analysis = parseJSON(r2.text);
  if (!analysis) throw new Error("Analyst agent failed to return valid JSON");

  sseWrite(sseRes, "agent", { step: 2, label: "ANALYST", status: "done", data: analysis });

  // ── Agent 3: Critic ───────────────────────────────────────────────────────
  sseWrite(sseRes, "agent", { step: 3, label: "CRITIC", status: "running" });

  const criticPrompt = `You are a critical reviewer for a prediction market analysis. Challenge the analyst's estimate and give a final verdict.

${marketContext}

Analyst's estimate: ${Math.round(analysis.aiProb * 100)}% (${analysis.signal}, confidence ${analysis.confidence})
Analyst's edge: ${analysis.edge}

Is the analyst being overconfident? Are there risks they missed? Give a final calibrated verdict.

Respond in JSON only:
{
  "verdict": "<STRONG BUY|BUY|NEUTRAL|SELL|STRONG SELL>",
  "finalProb": <0-1>,
  "adjustment": "<agreed|raised|lowered>",
  "critique": "<1 sentence: what the analyst may have missed or got right>"
}`;

  const r3 = await callClaude([{ role: "user", content: criticPrompt }], 400);
  const critique = parseJSON(r3.text);
  if (!critique) throw new Error("Critic agent failed to return valid JSON");

  sseWrite(sseRes, "agent", { step: 3, label: "CRITIC", status: "done", data: critique });

  // ── Final result ──────────────────────────────────────────────────────────
  return {
    aiProb: critique.finalProb ?? analysis.aiProb,
    signal: analysis.signal,
    confidence: analysis.confidence,
    edge: analysis.edge,
    bullCase: analysis.bullCase,
    bearCase: analysis.bearCase,
    verdict: critique.verdict,
    critique: critique.critique,
    research,
  };
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
      const limit = parseInt(query.limit) || 25;
      const { status, body } = await fetchUpstream("gamma-api.polymarket.com", `/markets?limit=${limit}&active=true&closed=false`);
      res.writeHead(status); res.end(JSON.stringify(body));
    } catch (err) { res.writeHead(502); res.end(JSON.stringify({ error: "Upstream error", detail: err.message })); }
    return;
  }

  // ── GET /market/:id ───────────────────────────────────────────────────────
  if (pathname.startsWith("/market/")) {
    res.setHeader("Content-Type", "application/json");
    try {
      const { status, body } = await fetchUpstream("gamma-api.polymarket.com", `/markets/${pathname.replace("/market/", "")}`);
      res.writeHead(status); res.end(JSON.stringify(body));
    } catch (err) { res.writeHead(502); res.end(JSON.stringify({ error: "Upstream error", detail: err.message })); }
    return;
  }

  // ── POST /analyze (SSE streaming, multi-agent) ────────────────────────────
  if (pathname === "/analyze" && req.method === "POST") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.writeHead(200);

    try {
      const { market } = await readBody(req);
      if (!market) { sseWrite(res, "error", { message: "No market data provided" }); res.end(); return; }

      sseWrite(res, "start", { marketId: market.id, mode: DEV_MODE ? "dev" : "prod" });

      const result = await runAgentPipeline(market, res);

      sseWrite(res, "result", result);
      res.end();
    } catch (err) {
      console.error("Analysis error:", err.message);
      sseWrite(res, "error", { message: err.message });
      res.end();
    }
    return;
  }

  // ── GET /kalshi ───────────────────────────────────────────────────────────
  if (pathname === "/kalshi") {
    res.setHeader("Content-Type", "application/json");
    try {
      const limit = parseInt(query.limit) || 20;
      const { status, body } = await fetchUpstream(
        "trading-api.kalshi.com",
        `/trade-api/v2/markets?limit=${limit}&status=open`
      );
      res.writeHead(status); res.end(JSON.stringify(body));
    } catch (err) { res.writeHead(502); res.end(JSON.stringify({ error: "Kalshi error", detail: err.message })); }
    return;
  }

  // ── GET /health ───────────────────────────────────────────────────────────
  if (pathname === "/health") {
    res.setHeader("Content-Type", "application/json");
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "ok",
      mode: DEV_MODE ? "dev (CLIProxyAPI)" : "prod (Anthropic API)",
      anthropicKeySet: !!ANTHROPIC_API_KEY,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  res.setHeader("Content-Type", "application/json");
  res.writeHead(404);
  res.end(JSON.stringify({ error: "Unknown route" }));
});

server.listen(PORT, () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  ◈ PolyAlpha Proxy Server — port ${PORT}`);
  console.log(`  → /markets        Polymarket data`);
  console.log(`  → /kalshi         Kalshi data`);
  console.log(`  → /analyze (POST) Multi-agent Claude (SSE)`);
  console.log(`  → /health         Status`);
  console.log(`  Mode: ${DEV_MODE ? "DEV (CLIProxyAPI @ 8317)" : "PROD (Anthropic API)"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});
