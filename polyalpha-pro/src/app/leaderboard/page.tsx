"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Trophy, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  wallet_address: string;
  username: string | null;
  total_pnl: number;
  win_rate: number;
  total_trades: number;
  trend: "up" | "down" | "flat";
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  cached: boolean;
}

type Period = "7d" | "30d" | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "all", label: "All Time" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncateAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatPnl(value: number) {
  const abs = Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value >= 0 ? `+$${abs}` : `-$${abs}`;
}

const RANK_ACCENT: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-gray-300",
  3: "text-amber-600",
};

const RANK_BORDER: Record<number, string> = {
  1: "border-yellow-400/30",
  2: "border-gray-300/20",
  3: "border-amber-600/20",
};

const RANK_BG: Record<number, string> = {
  1: "bg-yellow-400/5",
  2: "bg-gray-300/5",
  3: "bg-amber-600/5",
};

/* ------------------------------------------------------------------ */
/*  Skeleton row for loading state                                     */
/* ------------------------------------------------------------------ */

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[40px_1fr_100px_40px] md:grid-cols-[56px_1fr_140px_100px_100px_56px] items-center px-4 py-3 border-b border-border last:border-b-0 animate-pulse">
      <div className="h-4 w-6 bg-muted rounded" />
      <div className="space-y-1.5">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
      <div className="h-4 w-16 bg-muted rounded ml-auto" />
      <div className="hidden md:block h-4 w-10 bg-muted rounded ml-auto" />
      <div className="hidden md:block h-4 w-10 bg-muted rounded ml-auto" />
      <div className="h-4 w-4 bg-muted rounded mx-auto" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LeaderboardPage() {
  const { user } = useAuth();
  const currentAddress = user?.wallet?.address?.toLowerCase();
  const [period, setPeriod] = useState<Period>("all");

  const { data, isLoading, error } = useQuery<LeaderboardResponse>({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?period=${period}&limit=50`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
    refetchInterval: 5 * 60 * 1000, // match 5-min cache TTL
  });

  const entries = data?.leaderboard ?? [];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Leaderboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Top traders ranked by total P&amp;L
          </p>
        </div>

        {/* Period filter */}
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table container */}
      <div className="border border-border rounded-[11px] bg-card overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[40px_1fr_100px_40px] md:grid-cols-[56px_1fr_140px_100px_100px_56px] items-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border select-none">
          <span>#</span>
          <span>Trader</span>
          <span className="text-right">Total P&amp;L</span>
          <span className="hidden md:block text-right">Win Rate</span>
          <span className="hidden md:block text-right">Trades</span>
          <span className="text-center">7d</span>
        </div>

        {/* Loading state */}
        {isLoading && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Failed to load leaderboard. Try again later.
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && entries.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No trades yet. Start trading to appear on the leaderboard!
          </div>
        )}

        {/* Rows */}
        {!isLoading &&
          entries.map((entry) => {
            const isCurrentUser =
              !!currentAddress &&
              entry.wallet_address.toLowerCase() === currentAddress;

            const isTop3 = entry.rank <= 3;
            const rowBorder = isTop3 ? RANK_BORDER[entry.rank] : "";
            const rowBg = isTop3 ? RANK_BG[entry.rank] : "";
            const highlightBg = isCurrentUser ? "bg-pm-blue/10" : "";

            return (
              <div
                key={entry.user_id}
                className={`grid grid-cols-[40px_1fr_100px_40px] md:grid-cols-[56px_1fr_140px_100px_100px_56px] items-center px-4 py-3 text-sm transition-colors hover:bg-secondary/40 border-b border-border last:border-b-0 ${rowBorder} ${rowBg} ${highlightBg}`}
              >
                {/* Rank */}
                <span
                  className={`font-bold tabular-nums ${RANK_ACCENT[entry.rank] ?? "text-muted-foreground"}`}
                >
                  {entry.rank}
                </span>

                {/* Trader */}
                <div className="min-w-0">
                  <span className="font-medium truncate block">
                    {entry.username ?? truncateAddress(entry.wallet_address)}
                  </span>
                  {entry.username && (
                    <span className="text-[11px] text-muted-foreground">
                      {truncateAddress(entry.wallet_address)}
                    </span>
                  )}
                  {isCurrentUser && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-pm-blue/20 text-pm-blue font-medium">
                      You
                    </span>
                  )}
                </div>

                {/* P&L */}
                <span
                  className={`text-right font-bold tabular-nums ${
                    entry.total_pnl >= 0 ? "text-pm-green" : "text-pm-red"
                  }`}
                >
                  {formatPnl(entry.total_pnl)}
                </span>

                {/* Win Rate */}
                <span className="hidden md:block text-right tabular-nums text-muted-foreground">
                  {entry.win_rate}%
                </span>

                {/* Total Trades */}
                <span className="hidden md:block text-right tabular-nums text-muted-foreground">
                  {Number(entry.total_trades).toLocaleString()}
                </span>

                {/* Trend */}
                <span className="flex justify-center">
                  {entry.trend === "up" && (
                    <TrendingUp className="h-4 w-4 text-pm-green" />
                  )}
                  {entry.trend === "down" && (
                    <TrendingDown className="h-4 w-4 text-pm-red" />
                  )}
                  {entry.trend === "flat" && (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
              </div>
            );
          })}
      </div>

      {/* Footer */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading rankings...
        </div>
      )}
      {data?.cached && (
        <p className="text-[11px] text-muted-foreground text-center">
          Rankings refresh every 5 minutes
        </p>
      )}
    </div>
  );
}
