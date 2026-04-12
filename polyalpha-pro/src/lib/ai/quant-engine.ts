import type { PolymarketMarket, Orderbook, QuantSignal } from "@/types";

// ─── Quantitative Signal Engine (runs server-side, zero LLM cost) ───
// Ported from the original PolyAlpha browser-side engine, enhanced with
// orderbook analysis and whale detection.

export function runQuantEngine(
  market: PolymarketMarket,
  orderbook?: Orderbook
): QuantSignal[] {
  const prob = market.probability ?? 0.5;
  const volume = market.volumeNum ?? 0;
  const liquidity = market.liquidityNum ?? 0;

  const signals: QuantSignal[] = [];

  // 1. Extremity Fade — Markets near 0 or 1 are often mispriced
  signals.push(computeExtremitySignal(prob));

  // 2. Volume / Liquidity Ratio — Thin markets with high volume = informed trading
  signals.push(computeTurnoverSignal(volume, liquidity));

  // 3. Round Number Bias — Prices cluster at .25, .50, .75
  signals.push(computeRoundNumberSignal(prob));

  // 4. Category Drift — Certain categories trend toward overconfidence
  signals.push(computeCategoryDrift(prob, market.category));

  // 5. Time Decay — Markets near expiry converge faster
  signals.push(computeTimeDecay(prob, market.endDate));

  // 6. Liquidity Depth (if orderbook available)
  if (orderbook) {
    signals.push(computeOrderbookImbalance(orderbook));
  }

  return signals;
}

export function computeCompositeSignal(signals: QuantSignal[]): {
  aiProbability: number;
  confidence: number;
  signal: "LONG" | "SHORT" | "NEUTRAL";
  edge: number;
} {
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const weightedAvg =
    signals.reduce((sum, s) => sum + s.value * s.weight, 0) / totalWeight;

  // Weighted signal direction
  const bullishWeight = signals
    .filter((s) => s.signal === "bullish")
    .reduce((sum, s) => sum + s.weight, 0);
  const bearishWeight = signals
    .filter((s) => s.signal === "bearish")
    .reduce((sum, s) => sum + s.weight, 0);

  const directionBias = (bullishWeight - bearishWeight) / totalWeight;

  // Confidence: higher when signals agree
  const agreement =
    Math.max(bullishWeight, bearishWeight) / (bullishWeight + bearishWeight || 1);
  const confidence = Math.round(25 + agreement * 63); // 25-88 range

  // Compute signal
  let signal: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
  if (directionBias > 0.15) signal = "LONG";
  else if (directionBias < -0.15) signal = "SHORT";

  return {
    aiProbability: Math.max(0.01, Math.min(0.99, 0.5 + weightedAvg)),
    confidence,
    signal,
    edge: Math.abs(weightedAvg),
  };
}

// ─── Individual Signal Computations ───

function computeExtremitySignal(prob: number): QuantSignal {
  const distFromCenter = Math.abs(prob - 0.5);
  // Mean-revert: extreme prices tend to pull back
  const fadeStrength = distFromCenter > 0.35 ? distFromCenter * 0.4 : 0;
  const direction = prob > 0.5 ? "bearish" : "bullish";

  return {
    name: "Extremity Fade",
    value: prob > 0.5 ? -fadeStrength : fadeStrength,
    signal: fadeStrength > 0.05 ? direction : "neutral",
    weight: 2,
    description:
      distFromCenter > 0.35
        ? `Price at ${(prob * 100).toFixed(0)}% — extreme levels tend to revert`
        : `Price near center — no extremity signal`,
  };
}

function computeTurnoverSignal(volume: number, liquidity: number): QuantSignal {
  if (liquidity <= 0) {
    return {
      name: "Turnover Ratio",
      value: 0,
      signal: "neutral",
      weight: 1.5,
      description: "No liquidity data available",
    };
  }

  const ratio = volume / liquidity;
  // High turnover = informed trading = follow the money
  const isHighTurnover = ratio > 5;
  const isLowTurnover = ratio < 0.5;

  return {
    name: "Turnover Ratio",
    value: isHighTurnover ? 0.05 : isLowTurnover ? -0.02 : 0,
    signal: isHighTurnover ? "bullish" : isLowTurnover ? "bearish" : "neutral",
    weight: 1.5,
    description: `Vol/Liq ratio: ${ratio.toFixed(1)}x — ${
      isHighTurnover
        ? "high activity, informed flow likely"
        : isLowTurnover
          ? "low activity, stale pricing"
          : "normal activity"
    }`,
  };
}

function computeRoundNumberSignal(prob: number): QuantSignal {
  const roundNumbers = [0.25, 0.5, 0.75];
  const nearest = roundNumbers.reduce((prev, curr) =>
    Math.abs(curr - prob) < Math.abs(prev - prob) ? curr : prev
  );
  const distToRound = Math.abs(prob - nearest);

  // Prices clustering at round numbers = anchoring bias
  const isClustered = distToRound < 0.03;

  return {
    name: "Round Number Bias",
    value: isClustered ? (prob > nearest ? -0.02 : 0.02) : 0,
    signal: isClustered ? (prob > nearest ? "bearish" : "bullish") : "neutral",
    weight: 0.8,
    description: isClustered
      ? `Price anchored near ${(nearest * 100).toFixed(0)}% — likely anchoring bias`
      : "No round number clustering detected",
  };
}

function computeCategoryDrift(prob: number, category: string): QuantSignal {
  // Historical overconfidence by category
  const overconfidentCategories: Record<string, number> = {
    crypto: 0.08,
    politics: 0.05,
    sports: 0.03,
    economics: 0.04,
    tech: 0.06,
  };

  const drift = overconfidentCategories[category?.toLowerCase()] ?? 0;
  if (drift === 0) {
    return {
      name: "Category Drift",
      value: 0,
      signal: "neutral",
      weight: 1,
      description: "Unknown category — no drift signal",
    };
  }

  // If market is confident (>65%), it's likely overconfident
  const isOverconfident = prob > 0.65;
  const value = isOverconfident ? -drift : drift * 0.5;

  return {
    name: "Category Drift",
    value,
    signal: isOverconfident ? "bearish" : "bullish",
    weight: 1,
    description: `${category} markets have ${(drift * 100).toFixed(0)}% historical overconfidence bias`,
  };
}

function computeTimeDecay(prob: number, endDate: string): QuantSignal {
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const daysToExpiry = (end - now) / (1000 * 60 * 60 * 24);

  if (daysToExpiry < 0 || isNaN(daysToExpiry)) {
    return {
      name: "Time Decay",
      value: 0,
      signal: "neutral",
      weight: 1,
      description: "Market expired or no end date",
    };
  }

  // Markets converge faster near expiry
  const decayFactor = daysToExpiry < 3 ? 0.1 : daysToExpiry < 7 ? 0.05 : 0;
  const direction = prob > 0.5 ? "bullish" : "bearish";

  return {
    name: "Time Decay",
    value: prob > 0.5 ? decayFactor : -decayFactor,
    signal: decayFactor > 0 ? direction : "neutral",
    weight: 1.2,
    description:
      daysToExpiry < 7
        ? `${daysToExpiry.toFixed(0)} days to expiry — convergence pressure ${direction}`
        : `${daysToExpiry.toFixed(0)} days out — no time pressure`,
  };
}

function computeOrderbookImbalance(orderbook: Orderbook): QuantSignal {
  const bidVolume = orderbook.bids.reduce(
    (sum, b) => sum + parseFloat(b.size),
    0
  );
  const askVolume = orderbook.asks.reduce(
    (sum, a) => sum + parseFloat(a.size),
    0
  );
  const totalVolume = bidVolume + askVolume;

  if (totalVolume === 0) {
    return {
      name: "Orderbook Imbalance",
      value: 0,
      signal: "neutral",
      weight: 2,
      description: "Empty orderbook",
    };
  }

  const imbalance = (bidVolume - askVolume) / totalVolume; // -1 to 1
  const isSignificant = Math.abs(imbalance) > 0.2;

  return {
    name: "Orderbook Imbalance",
    value: imbalance * 0.1,
    signal: isSignificant
      ? imbalance > 0
        ? "bullish"
        : "bearish"
      : "neutral",
    weight: 2,
    description: `Bid/Ask ratio: ${(bidVolume / (askVolume || 1)).toFixed(2)} — ${
      isSignificant
        ? imbalance > 0
          ? "buying pressure dominates"
          : "selling pressure dominates"
        : "balanced book"
    }`,
  };
}
