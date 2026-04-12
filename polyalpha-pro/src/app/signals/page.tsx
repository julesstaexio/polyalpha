"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import type { PolymarketMarket, QuantSignal } from "@/types";
import { runQuantEngine, computeCompositeSignal } from "@/lib/ai/quant-engine";

interface MarketsResponse {
  markets: PolymarketMarket[];
  count: number;
}

interface MarketWithSignals {
  market: PolymarketMarket;
  signals: QuantSignal[];
  composite: {
    aiProbability: number;
    confidence: number;
    signal: "LONG" | "SHORT" | "NEUTRAL";
    edge: number;
  };
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function SignalBadge({ signal }: { signal: "LONG" | "SHORT" | "NEUTRAL" }) {
  if (signal === "LONG") {
    return (
      <span className="inline-flex items-center gap-1 text-pm-green text-xs font-semibold">
        <TrendingUp className="h-3.5 w-3.5" />
        Bullish
      </span>
    );
  }
  if (signal === "SHORT") {
    return (
      <span className="inline-flex items-center gap-1 text-pm-red text-xs font-semibold">
        <TrendingDown className="h-3.5 w-3.5" />
        Bearish
      </span>
    );
  }
  return (
    <span className="text-muted-foreground text-xs font-semibold">Neutral</span>
  );
}

function SignalBar({ signal }: { signal: QuantSignal }) {
  const pct = Math.min(Math.abs(signal.value) * 500, 100);
  const color =
    signal.signal === "bullish"
      ? "bg-pm-green"
      : signal.signal === "bearish"
        ? "bg-pm-red"
        : "bg-muted-foreground/40";

  return (
    <div className="flex items-center gap-2 min-w-0" title={signal.description}>
      <span className="text-[11px] text-muted-foreground w-[100px] shrink-0 truncate">
        {signal.name}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
    </div>
  );
}

export default function SignalsPage() {
  const { data, isLoading, error } = useQuery<MarketsResponse>({
    queryKey: ["signals-markets", 20],
    queryFn: async () => {
      const res = await fetch("/api/markets?limit=20");
      if (!res.ok) throw new Error("Failed to fetch markets");
      return res.json();
    },
  });

  const ranked: MarketWithSignals[] = useMemo(() => {
    if (!data?.markets) return [];

    return data.markets
      .map((market) => {
        const signals = runQuantEngine(market);
        const composite = computeCompositeSignal(signals);
        return { market, signals, composite };
      })
      .sort((a, b) => b.composite.edge - a.composite.edge);
  }, [data]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-pm-blue" />
          AI Signals
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Quantitative signals across active markets, ranked by edge strength
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-pm-red text-sm">
          Failed to load markets.
        </div>
      ) : ranked.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          No markets found.
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_80px_100px_200px_80px] gap-3 px-4 py-2 text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
            <span>Market</span>
            <span className="text-right">Prob</span>
            <span className="text-center">Signal</span>
            <span>Indicators</span>
            <span className="text-right">Volume</span>
          </div>

          {/* Rows */}
          {ranked.map(({ market, signals, composite }) => {
            const prob = market.probability ?? 0.5;
            const vol = market.volumeNum ?? (parseFloat(market.volume) || 0);

            return (
              <div
                key={market.conditionId || market.id}
                className="border border-border rounded-[11px] bg-card px-4 py-3 grid grid-cols-[1fr_60px_80px] md:grid-cols-[1fr_80px_100px_200px_80px] gap-2 md:gap-3 items-center"
              >
                {/* Question */}
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug truncate">
                    {market.question}
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    {market.category}
                  </span>
                </div>

                {/* Probability */}
                <div className="text-right tabular-nums">
                  <span className="text-sm font-semibold">
                    {(prob * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Composite signal */}
                <div className="text-center space-y-0.5">
                  <SignalBadge signal={composite.signal} />
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    {composite.confidence}% conf
                  </div>
                </div>

                {/* Individual signal bars */}
                <div className="hidden md:block space-y-1">
                  {signals.slice(0, 4).map((s) => (
                    <SignalBar key={s.name} signal={s} />
                  ))}
                </div>

                {/* Volume */}
                <div className="hidden md:block text-right">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatVolume(vol)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
