"use client";

import { useAnalysis } from "@/hooks/use-analysis";
import { Loader2, RefreshCw, TrendingDown, TrendingUp, Minus, Brain } from "lucide-react";
import type { MarketAnalysis, QuantSignal } from "@/types";

function SignalBadge({ signal }: { signal: "LONG" | "SHORT" | "NEUTRAL" }) {
  if (signal === "LONG")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-pm-green/15 text-pm-green">
        <TrendingUp className="h-3 w-3" />
        LONG
      </span>
    );
  if (signal === "SHORT")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-pm-red/15 text-pm-red">
        <TrendingDown className="h-3 w-3" />
        SHORT
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground">
      <Minus className="h-3 w-3" />
      NEUTRAL
    </span>
  );
}

function QuantSignalRow({ signal }: { signal: QuantSignal }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-muted-foreground">{signal.name}</span>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium ${
            signal.signal === "bullish"
              ? "text-pm-green"
              : signal.signal === "bearish"
                ? "text-pm-red"
                : "text-muted-foreground"
          }`}
        >
          {signal.signal}
        </span>
        <div className="w-12 h-1 rounded-full bg-secondary overflow-hidden">
          <div
            className={`h-full rounded-full ${
              signal.signal === "bullish"
                ? "bg-pm-green"
                : signal.signal === "bearish"
                  ? "bg-pm-red"
                  : "bg-muted-foreground"
            }`}
            style={{
              width: `${Math.min(100, Math.abs(signal.value) * 500 + 20)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface AIAnalysisPanelProps {
  conditionId: string;
  userId?: string;
}

export function AIAnalysisPanel({ conditionId, userId }: AIAnalysisPanelProps) {
  const { analyses, isAnalyzing, streamingText, analyze, cancel } =
    useAnalysis();
  const analysis: MarketAnalysis | undefined = analyses[conditionId];

  return (
    <div className="border border-border rounded-[11px] bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-pm-blue" />
          AI Analysis
        </h3>
        <button
          onClick={() =>
            isAnalyzing ? cancel() : analyze(conditionId, userId)
          }
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary rounded-md transition-colors"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Stop
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3" />
              {analysis ? "Refresh" : "Analyze"}
            </>
          )}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Streaming state */}
        {isAnalyzing && !analysis && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-pm-blue">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing market data...
            </div>
            {streamingText && (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {streamingText}
              </p>
            )}
          </div>
        )}

        {/* Empty state */}
        {!analysis && !isAnalyzing && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Click Analyze to get AI-driven insights
          </p>
        )}

        {/* Analysis results */}
        {analysis && (
          <>
            {/* Signal + Confidence */}
            <div className="flex items-center justify-between">
              <SignalBadge signal={analysis.signal} />
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">
                  Confidence
                </div>
                <div className="text-lg font-bold tabular-nums">
                  {analysis.confidence}%
                </div>
              </div>
            </div>

            {/* Probability comparison */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-secondary rounded-lg p-2">
                <div className="text-[10px] text-muted-foreground">Market</div>
                <div className="text-sm font-bold tabular-nums">
                  {(analysis.marketProbability * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-pm-blue/10 rounded-lg p-2 border border-pm-blue/20">
                <div className="text-[10px] text-pm-blue">AI Fair Value</div>
                <div className="text-sm font-bold tabular-nums text-pm-blue">
                  {(analysis.aiProbability * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-2">
                <div className="text-[10px] text-muted-foreground">Edge</div>
                <div
                  className={`text-sm font-bold tabular-nums ${
                    analysis.edge > 0.05 ? "text-pm-green" : "text-muted-foreground"
                  }`}
                >
                  {(analysis.edge * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Summary */}
            <p className="text-xs leading-relaxed text-foreground/90">
              {analysis.summary}
            </p>

            <div className="border-t border-border" />

            {/* Key Factors */}
            {analysis.keyFactors.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-1.5">Key Factors</h4>
                <ul className="space-y-1">
                  {analysis.keyFactors.map((f, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex gap-1.5"
                    >
                      <span className="text-pm-blue shrink-0">-</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks */}
            {analysis.risks.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-1.5">Risks</h4>
                <ul className="space-y-1">
                  {analysis.risks.map((r, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex gap-1.5"
                    >
                      <span className="text-pm-red shrink-0">!</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-border" />

            {/* Quant Signals */}
            {analysis.quantSignals.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-1">Quant Signals</h4>
                {analysis.quantSignals.map((s, i) => (
                  <QuantSignalRow key={i} signal={s} />
                ))}
              </div>
            )}

            {/* Timestamp */}
            <p className="text-[10px] text-muted-foreground text-right">
              Updated {new Date(analysis.updatedAt).toLocaleTimeString()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
