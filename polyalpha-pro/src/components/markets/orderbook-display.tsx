"use client";

import type { Orderbook } from "@/types";

interface OrderbookDisplayProps {
  orderbook: Orderbook | null;
  bare?: boolean;
}

function formatSize(size: string): string {
  const n = parseFloat(size);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function OrderbookDisplay({ orderbook, bare }: OrderbookDisplayProps) {
  if (!orderbook) {
    const empty = (
      <p className="text-xs text-muted-foreground text-center py-6">
        No orderbook data available
      </p>
    );

    if (bare) return empty;

    return (
      <div className="border border-border rounded-[11px] bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Orderbook</h3>
        </div>
        <div className="p-4">{empty}</div>
      </div>
    );
  }

  const bids = orderbook.bids.slice(0, 8);
  const asks = orderbook.asks.slice(0, 8);

  const maxBidSize = Math.max(...bids.map((b) => parseFloat(b.size)), 1);
  const maxAskSize = Math.max(...asks.map((a) => parseFloat(a.size)), 1);

  const content = (
    <div className="space-y-1 text-xs">
      {/* Header */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-1 pb-1">
        <span>Price</span>
        <span>Size</span>
      </div>

      {/* Asks (reversed so lowest ask is at bottom) */}
      <div className="space-y-0.5">
        {[...asks].reverse().map((ask, i) => {
          const pct = (parseFloat(ask.size) / maxAskSize) * 100;
          return (
            <div
              key={`ask-${i}`}
              className="relative flex justify-between px-1 py-0.5"
            >
              <div
                className="absolute inset-y-0 right-0 bg-pm-red/10 rounded-sm"
                style={{ width: `${pct}%` }}
              />
              <span className="relative text-pm-red tabular-nums">
                {(parseFloat(ask.price) * 100).toFixed(1)}¢
              </span>
              <span className="relative text-muted-foreground tabular-nums">
                {formatSize(ask.size)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Spread */}
      {bids.length > 0 && asks.length > 0 && (
        <div className="text-center text-[10px] text-muted-foreground py-1 border-y border-border/50">
          Spread:{" "}
          {(
            (parseFloat(asks[0].price) - parseFloat(bids[0].price)) *
            100
          ).toFixed(2)}
          ¢
        </div>
      )}

      {/* Bids */}
      <div className="space-y-0.5">
        {bids.map((bid, i) => {
          const pct = (parseFloat(bid.size) / maxBidSize) * 100;
          return (
            <div
              key={`bid-${i}`}
              className="relative flex justify-between px-1 py-0.5"
            >
              <div
                className="absolute inset-y-0 right-0 bg-pm-green/10 rounded-sm"
                style={{ width: `${pct}%` }}
              />
              <span className="relative text-pm-green tabular-nums">
                {(parseFloat(bid.price) * 100).toFixed(1)}¢
              </span>
              <span className="relative text-muted-foreground tabular-nums">
                {formatSize(bid.size)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (bare) return content;

  return (
    <div className="border border-border rounded-[11px] bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Orderbook</h3>
      </div>
      <div className="p-4">{content}</div>
    </div>
  );
}
