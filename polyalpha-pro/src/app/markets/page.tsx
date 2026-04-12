"use client";

import { useState } from "react";
import { useMarkets } from "@/hooks/use-markets";
import { useMarketStore } from "@/store";
import { MarketCard } from "@/components/markets/market-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const CATEGORIES = [
  "all",
  "crypto",
  "politics",
  "sports",
  "economics",
  "tech",
  "entertainment",
  "science",
];

export default function MarketsPage() {
  const { searchQuery, categoryFilter, setCategoryFilter, sortBy, setSortBy } =
    useMarketStore();
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data, isLoading, error } = useMarkets(
    limit,
    page * limit,
    categoryFilter !== "all" ? categoryFilter : undefined,
    searchQuery || undefined
  );

  const markets = data?.markets ?? [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category pills */}
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                categoryFilter === cat
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all"
                ? "All"
                : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as typeof sortBy)}
          >
            <SelectTrigger className="w-36 h-8 text-xs bg-secondary border-0 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="liquidity">Liquidity</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="ending_soon">Ending Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data && (
          <span className="text-xs text-muted-foreground">
            {data.count} markets
          </span>
        )}
      </div>

      {/* Market grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-pm-red text-sm">
          Failed to load markets.
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          No markets found.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {markets.map((market) => (
              <MarketCard
                key={market.id || market.conditionId}
                market={market}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              Page {page + 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              disabled={markets.length < limit}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
