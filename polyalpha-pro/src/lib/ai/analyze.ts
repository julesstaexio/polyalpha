import Anthropic from "@anthropic-ai/sdk";
import type { PolymarketMarket, Orderbook, MarketAnalysis } from "@/types";
import { runQuantEngine, computeCompositeSignal } from "./quant-engine";
import { getCached, setCache } from "@/lib/redis";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are a senior prediction market analyst. You analyze prediction markets using quantitative data, news sentiment, and market microstructure.

Your job is to provide actionable analysis for traders. Be specific, cite data, and give clear directional signals. Avoid hedging language — commit to a view with an explicit confidence level.

Output valid JSON matching the requested schema. No markdown, no explanation outside the JSON.`;

function buildAnalysisPrompt(
  market: PolymarketMarket,
  quantSignals: ReturnType<typeof runQuantEngine>,
  composite: ReturnType<typeof computeCompositeSignal>
): string {
  return `Analyze this Polymarket prediction market:

MARKET: "${market.question}"
Category: ${market.category || "Unknown"}
Current Price: ${((market.probability ?? 0.5) * 100).toFixed(1)}%
Volume: $${(market.volumeNum ?? 0).toLocaleString()}
Liquidity: $${(market.liquidityNum ?? 0).toLocaleString()}
End Date: ${market.endDate}

QUANTITATIVE SIGNALS (from our algo engine):
${quantSignals.map((s) => `- ${s.name}: ${s.signal} (${s.description})`).join("\n")}

COMPOSITE QUANT SIGNAL: ${composite.signal} | Confidence: ${composite.confidence}% | Edge: ${(composite.edge * 100).toFixed(1)}%
Algo Fair Value: ${(composite.aiProbability * 100).toFixed(1)}%

Provide your analysis as JSON with this exact schema:
{
  "summary": "2-3 sentence overview of the market and your thesis",
  "signal": "LONG" or "SHORT" or "NEUTRAL",
  "confidence": number 0-100,
  "aiProbability": number 0-1 (your estimated fair probability),
  "sentiment": "bullish" or "bearish" or "mixed",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "risks": ["risk1", "risk2"],
  "dataPoints": {
    "volumeTrend": "increasing" or "decreasing" or "stable",
    "liquidityDepth": "deep" or "moderate" or "thin",
    "smartMoneyFlow": "brief description",
    "newsImpact": "brief description"
  }
}`;
}

export async function analyzeMarket(
  market: PolymarketMarket,
  orderbook?: Orderbook
): Promise<MarketAnalysis> {
  // Check cache first (5 min TTL)
  const cacheKey = `analysis:${market.conditionId}`;
  const cached = await getCached<MarketAnalysis>(cacheKey);
  if (cached) return cached;

  // Run quant engine (instant, no API call)
  const quantSignals = runQuantEngine(market, orderbook);
  const composite = computeCompositeSignal(quantSignals);

  // Call Claude for deep analysis
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildAnalysisPrompt(market, quantSignals, composite),
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Fallback to quant-only analysis if Claude response is malformed
    parsed = {
      summary: `Quantitative analysis for "${market.question}". The algo engine suggests a ${composite.signal} signal with ${composite.confidence}% confidence.`,
      signal: composite.signal,
      confidence: composite.confidence,
      aiProbability: composite.aiProbability,
      sentiment:
        composite.signal === "LONG"
          ? "bullish"
          : composite.signal === "SHORT"
            ? "bearish"
            : "mixed",
      keyFactors: quantSignals
        .filter((s) => s.signal !== "neutral")
        .map((s) => s.description),
      risks: ["AI analysis unavailable — using quant signals only"],
      dataPoints: {
        volumeTrend: "stable",
        liquidityDepth:
          (market.liquidityNum ?? 0) > 50000
            ? "deep"
            : (market.liquidityNum ?? 0) > 10000
              ? "moderate"
              : "thin",
        smartMoneyFlow: "Data unavailable",
        newsImpact: "Data unavailable",
      },
    };
  }

  const analysis: MarketAnalysis = {
    summary: (parsed.summary as string) || "",
    signal: (parsed.signal as MarketAnalysis["signal"]) || composite.signal,
    confidence: (parsed.confidence as number) || composite.confidence,
    aiProbability:
      (parsed.aiProbability as number) || composite.aiProbability,
    marketProbability: market.probability ?? 0.5,
    edge: Math.abs(
      ((parsed.aiProbability as number) || composite.aiProbability) -
        (market.probability ?? 0.5)
    ),
    sentiment:
      (parsed.sentiment as MarketAnalysis["sentiment"]) || "mixed",
    keyFactors: (parsed.keyFactors as string[]) || [],
    risks: (parsed.risks as string[]) || [],
    dataPoints: (parsed.dataPoints as MarketAnalysis["dataPoints"]) || {
      volumeTrend: "stable",
      liquidityDepth: "moderate",
      smartMoneyFlow: "Unknown",
      newsImpact: "Unknown",
    },
    quantSignals,
    updatedAt: new Date().toISOString(),
  };

  await setCache(cacheKey, analysis, 300); // 5 min cache
  return analysis;
}

// Stream analysis via SSE for real-time feel
export async function streamAnalysis(
  market: PolymarketMarket,
  orderbook?: Orderbook,
  onChunk: (chunk: string) => void = () => {}
): Promise<MarketAnalysis> {
  const quantSignals = runQuantEngine(market, orderbook);
  const composite = computeCompositeSignal(quantSignals);

  // Send quant signals immediately
  onChunk(
    JSON.stringify({
      type: "quant",
      data: { quantSignals, composite },
    })
  );

  // Stream Claude response
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildAnalysisPrompt(market, quantSignals, composite),
      },
    ],
  });

  let fullText = "";

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fullText += event.delta.text;
      onChunk(JSON.stringify({ type: "text", data: event.delta.text }));
    }
  }

  // Parse final result
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(fullText);
  } catch {
    parsed = {};
  }

  const analysis: MarketAnalysis = {
    summary: (parsed.summary as string) || composite.signal,
    signal: (parsed.signal as MarketAnalysis["signal"]) || composite.signal,
    confidence: (parsed.confidence as number) || composite.confidence,
    aiProbability:
      (parsed.aiProbability as number) || composite.aiProbability,
    marketProbability: market.probability ?? 0.5,
    edge: Math.abs(
      ((parsed.aiProbability as number) || composite.aiProbability) -
        (market.probability ?? 0.5)
    ),
    sentiment:
      (parsed.sentiment as MarketAnalysis["sentiment"]) || "mixed",
    keyFactors: (parsed.keyFactors as string[]) || [],
    risks: (parsed.risks as string[]) || [],
    dataPoints: (parsed.dataPoints as MarketAnalysis["dataPoints"]) || {
      volumeTrend: "stable",
      liquidityDepth: "moderate",
      smartMoneyFlow: "Unknown",
      newsImpact: "Unknown",
    },
    quantSignals,
    updatedAt: new Date().toISOString(),
  };

  onChunk(JSON.stringify({ type: "done", data: analysis }));
  return analysis;
}
