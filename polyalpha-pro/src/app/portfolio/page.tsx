"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Clock,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { useState } from "react";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import { DepositWithdraw } from "@/components/trading/deposit-withdraw";
import { DeriveKeys } from "@/components/trading/derive-keys";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#3db468", "#cb3131", "#2080c0", "#f0b90b", "#7b8996"];

export default function PortfolioPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [tab, setTab] = useState<"positions" | "history" | "analytics">(
    "positions"
  );
  const { balance, isConnected } = useWalletBalance();

  const { data: trades, isLoading } = useQuery({
    queryKey: ["trades", userId],
    queryFn: async () => {
      const res = await fetch(`/api/trade/history?userId=${userId}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.trades || [];
    },
    enabled: !!userId,
  });

  const openTrades =
    trades?.filter(
      (t: { status: string }) => t.status === "open" || t.status === "pending"
    ) || [];
  const closedTrades =
    trades?.filter(
      (t: { status: string }) =>
        t.status === "filled" || t.status === "cancelled"
    ) || [];
  const totalPnl = closedTrades.reduce(
    (sum: number, t: { pnl?: number }) => sum + (t.pnl || 0),
    0
  );

  // Generate cumulative P&L chart data from closed trades
  const pnlChartData = useMemo(() => {
    if (!closedTrades.length) return [];
    let cumulative = 0;
    return closedTrades
      .sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map((t: { pnl?: number; created_at: string }) => {
        cumulative += t.pnl || 0;
        return {
          date: new Date(t.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          pnl: parseFloat(cumulative.toFixed(2)),
        };
      });
  }, [closedTrades]);

  // Outcome distribution for pie chart
  const outcomeData = useMemo(() => {
    const wins = closedTrades.filter(
      (t: { pnl?: number }) => (t.pnl || 0) > 0
    ).length;
    const losses = closedTrades.filter(
      (t: { pnl?: number }) => (t.pnl || 0) < 0
    ).length;
    const breakeven = closedTrades.length - wins - losses;
    return [
      { name: "Wins", value: wins },
      { name: "Losses", value: losses },
      { name: "Breakeven", value: breakeven },
    ].filter((d) => d.value > 0);
  }, [closedTrades]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-pm-blue" />
          Portfolio
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Track your positions, trades, and P&L
        </p>
      </div>

      {/* Wallet balance + Deposit/Withdraw */}
      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-3">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Wallet USDC",
                  value: `$${balance.toFixed(2)}`,
                  icon: Wallet,
                  color: "text-pm-blue",
                },
                {
                  label: "Total P&L",
                  value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`,
                  icon: DollarSign,
                  color: totalPnl >= 0 ? "text-pm-green" : "text-pm-red",
                },
                {
                  label: "Open Positions",
                  value: openTrades.length,
                  icon: TrendingUp,
                  color: "text-foreground",
                },
                {
                  label: "Win Rate",
                  value:
                    closedTrades.length > 0
                      ? `${(
                          (closedTrades.filter(
                            (t: { pnl?: number }) => (t.pnl || 0) > 0
                          ).length /
                            closedTrades.length) *
                          100
                        ).toFixed(0)}%`
                      : "-",
                  icon: TrendingUp,
                  color: "text-foreground",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="border border-border rounded-[11px] bg-card p-4"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <stat.icon className="h-3 w-3" />
                    {stat.label}
                  </div>
                  <div className={`text-xl font-bold tabular-nums ${stat.color}`}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
            <DeriveKeys />
          </div>
          <div>
            <DepositWithdraw />
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total P&L",
              value: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`,
              icon: DollarSign,
              color: totalPnl >= 0 ? "text-pm-green" : "text-pm-red",
            },
            {
              label: "Open Positions",
              value: openTrades.length,
              icon: TrendingUp,
              color: "text-foreground",
            },
            {
              label: "Total Trades",
              value: trades?.length || 0,
              icon: Clock,
              color: "text-foreground",
            },
            {
              label: "Win Rate",
              value:
                closedTrades.length > 0
                  ? `${(
                      (closedTrades.filter(
                        (t: { pnl?: number }) => (t.pnl || 0) > 0
                      ).length /
                        closedTrades.length) *
                      100
                    ).toFixed(0)}%`
                  : "-",
              icon: TrendingUp,
              color: "text-foreground",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="border border-border rounded-[11px] bg-card p-4"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <stat.icon className="h-3 w-3" />
                {stat.label}
              </div>
              <div className={`text-xl font-bold tabular-nums ${stat.color}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {(
          [
            { key: "positions", label: `Positions (${openTrades.length})` },
            { key: "history", label: `History (${closedTrades.length})` },
            { key: "analytics", label: "Analytics" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Positions tab */}
      {tab === "positions" && (
        <>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : openTrades.length === 0 ? (
            <div className="border border-border rounded-[11px] bg-card py-12 text-center text-muted-foreground text-sm">
              No open positions. Start trading on the Markets page.
            </div>
          ) : (
            <div className="space-y-2">
              {openTrades.map(
                (trade: Record<string, string | number>) => (
                  <div
                    key={trade.id as string}
                    className="border border-border rounded-[11px] bg-card p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {(trade.market_question as string) ||
                          (trade.market_id as string)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            trade.side === "BUY"
                              ? "bg-pm-green/15 text-pm-green"
                              : "bg-pm-red/15 text-pm-red"
                          }`}
                        >
                          {trade.side as string} {trade.outcome as string}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @ {((trade.price as number) * 100).toFixed(0)}¢
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ${trade.size as number}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-secondary rounded text-muted-foreground">
                      {trade.status as string}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}

      {/* History tab */}
      {tab === "history" && (
        <>
          {closedTrades.length === 0 ? (
            <div className="border border-border rounded-[11px] bg-card py-12 text-center text-muted-foreground text-sm">
              No trade history yet.
            </div>
          ) : (
            <div className="space-y-2">
              {closedTrades.map(
                (trade: Record<string, string | number>) => (
                  <div
                    key={trade.id as string}
                    className="border border-border rounded-[11px] bg-card p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium line-clamp-1">
                        {(trade.market_question as string) ||
                          (trade.market_id as string)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            trade.side === "BUY"
                              ? "bg-pm-green/15 text-pm-green"
                              : "bg-pm-red/15 text-pm-red"
                          }`}
                        >
                          {trade.side as string}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            trade.created_at as string
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        ((trade.pnl as number) || 0) >= 0
                          ? "text-pm-green"
                          : "text-pm-red"
                      }`}
                    >
                      {((trade.pnl as number) || 0) >= 0 ? "+" : ""}$
                      {Math.abs((trade.pnl as number) || 0).toFixed(2)}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}

      {/* Analytics tab */}
      {tab === "analytics" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cumulative P&L Chart */}
          <div className="border border-border rounded-[11px] bg-card">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Cumulative P&L</h3>
            </div>
            <div className="p-4" style={{ height: 240 }}>
              {pnlChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pnlChartData}>
                    <defs>
                      <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={totalPnl >= 0 ? "#3db468" : "#cb3131"}
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="100%"
                          stopColor={totalPnl >= 0 ? "#3db468" : "#cb3131"}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#7b8996" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#7b8996" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                      width={45}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1c2127",
                        border: "1px solid #242b32",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value) => [
                        `$${Number(value).toFixed(2)}`,
                        "P&L",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="pnl"
                      stroke={totalPnl >= 0 ? "#3db468" : "#cb3131"}
                      strokeWidth={2}
                      fill="url(#pnlGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  Complete some trades to see your P&L curve
                </div>
              )}
            </div>
          </div>

          {/* Win/Loss Distribution */}
          <div className="border border-border rounded-[11px] bg-card">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Outcome Distribution</h3>
            </div>
            <div className="p-4" style={{ height: 240 }}>
              {outcomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={outcomeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {outcomeData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1c2127",
                        border: "1px solid #242b32",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  No completed trades yet
                </div>
              )}
            </div>
            {outcomeData.length > 0 && (
              <div className="px-4 pb-4 flex items-center justify-center gap-4">
                {outcomeData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {d.name} ({d.value})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
