"use client";

import { useMarkets } from "@/hooks/use-markets";
import { MarketCard } from "@/components/markets/market-card";
import { useMarketStore } from "@/store";
import { Loader2 } from "lucide-react";
import { useRealtimePrices } from "@/hooks/use-realtime-prices";

export default function HomePage() {
  const { searchQuery } = useMarketStore();
  const { data, isLoading } = useMarkets(50, 0, undefined, searchQuery || undefined);
  useRealtimePrices(30000); // auto-refresh every 30s
  const markets = data?.markets ?? [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4">
      {/* Market feed — vertical list like Polymarket */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          No markets found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {markets.map((market) => (
            <MarketCard key={market.id || market.conditionId} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
