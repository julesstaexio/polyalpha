"use client";

import { useAuth } from "@/hooks/use-auth";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock data — replace with real API when multi-user backend is ready */
/* ------------------------------------------------------------------ */

interface LeaderboardEntry {
  rank: number;
  address: string;
  username: string | null;
  pnl: number;
  winRate: number;
  totalTrades: number;
  trend: "up" | "down" | "flat";
}

const MOCK_DATA: LeaderboardEntry[] = [
  { rank: 1, address: "0x1a2B3c4D5e6F7890AbCdEf1234567890aBcDeF12", username: "alpha_shark", pnl: 48720.5, winRate: 78, totalTrades: 312, trend: "up" },
  { rank: 2, address: "0x9f8E7d6C5b4A3210fEdCbA0987654321FeDcBa98", username: "polywhale", pnl: 31450.0, winRate: 72, totalTrades: 245, trend: "up" },
  { rank: 3, address: "0xAbCdEf1234567890abcdef1234567890AbCdEf12", username: null, pnl: 22180.75, winRate: 69, totalTrades: 189, trend: "down" },
  { rank: 4, address: "0x1234AbCd5678EfGh9012IjKl3456MnOp7890QrSt", username: "degen_labs", pnl: 15890.3, winRate: 65, totalTrades: 410, trend: "up" },
  { rank: 5, address: "0xFeDcBa0987654321fEdCbA0987654321FeDcBa98", username: null, pnl: 9340.2, winRate: 61, totalTrades: 156, trend: "flat" },
  { rank: 6, address: "0x5678EfGh9012AbCd3456IjKl7890MnOp1234QrSt", username: "event_trader", pnl: 5210.0, winRate: 58, totalTrades: 98, trend: "down" },
  { rank: 7, address: "0xAa1Bb2Cc3Dd4Ee5Ff6Gg7Hh8Ii9Jj0Kk1Ll2Mm3N", username: "quant_anon", pnl: 2780.45, winRate: 55, totalTrades: 203, trend: "up" },
  { rank: 8, address: "0x0000111122223333444455556666777788889999", username: null, pnl: -420.0, winRate: 44, totalTrades: 67, trend: "down" },
  { rank: 9, address: "0xDeAdBeEf00000000DeAdBeEf00000000DeAdBeEf", username: "bag_holder_9", pnl: -1850.6, winRate: 38, totalTrades: 142, trend: "down" },
  { rank: 10, address: "0xCaFeBaBe11111111CaFeBaBe11111111CaFeBaBe", username: null, pnl: -4320.9, winRate: 31, totalTrades: 88, trend: "down" },
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
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LeaderboardPage() {
  const { user } = useAuth();
  const currentAddress = user?.wallet?.address?.toLowerCase();

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Leaderboard
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Top traders ranked by total P&amp;L
        </p>
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

        {/* Rows */}
        {MOCK_DATA.map((entry) => {
          const isCurrentUser =
            !!currentAddress &&
            entry.address.toLowerCase() === currentAddress;

          const isTop3 = entry.rank <= 3;
          const rowBorder = isTop3 ? RANK_BORDER[entry.rank] : "";
          const rowBg = isTop3 ? RANK_BG[entry.rank] : "";
          const highlightBg = isCurrentUser ? "bg-pm-blue/10" : "";

          return (
            <div
              key={entry.rank}
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
                  {entry.username ?? truncateAddress(entry.address)}
                </span>
                {entry.username && (
                  <span className="text-[11px] text-muted-foreground">
                    {truncateAddress(entry.address)}
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
                  entry.pnl >= 0 ? "text-pm-green" : "text-pm-red"
                }`}
              >
                {formatPnl(entry.pnl)}
              </span>

              {/* Win Rate */}
              <span className="hidden md:block text-right tabular-nums text-muted-foreground">
                {entry.winRate}%
              </span>

              {/* Total Trades */}
              <span className="hidden md:block text-right tabular-nums text-muted-foreground">
                {entry.totalTrades.toLocaleString()}
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

      {/* Footer note */}
      <p className="text-[11px] text-muted-foreground text-center">
        Showing mock data. Live rankings will appear once the multi-user API is connected.
      </p>
    </div>
  );
}
