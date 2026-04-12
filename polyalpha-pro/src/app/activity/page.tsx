"use client";

import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  SkipForward,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { Trade, BotRun, BotConfig } from "@/types";

// ─── Relative time formatting ───

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  return new Date(dateStr).toLocaleDateString();
}

// ─── Unified activity item ───

type ActivityItem =
  | { type: "trade"; data: Trade; timestamp: string }
  | {
      type: "bot_run";
      data: BotRun & { botName?: string };
      timestamp: string;
    };

function actionColor(action: string): string {
  switch (action) {
    case "BUY":
      return "text-pm-green";
    case "SELL":
      return "text-pm-red";
    case "ERROR":
      return "text-pm-red";
    default:
      return "text-muted-foreground";
  }
}

function actionBgColor(action: string): string {
  switch (action) {
    case "BUY":
      return "bg-pm-green/15";
    case "SELL":
      return "bg-pm-red/15";
    case "ERROR":
      return "bg-pm-red/15";
    default:
      return "bg-secondary";
  }
}

function ActionIcon({ action }: { action: string }) {
  const cls = `h-4 w-4 ${actionColor(action)}`;
  switch (action) {
    case "BUY":
      return <ArrowUpRight className={cls} />;
    case "SELL":
      return <ArrowDownRight className={cls} />;
    case "SKIP":
      return <SkipForward className={cls} />;
    case "ERROR":
      return <AlertTriangle className={cls} />;
    default:
      return <Activity className={cls} />;
  }
}

// ─── Activity card components ───

function TradeCard({ trade }: { trade: Trade }) {
  return (
    <div className="border border-border rounded-[11px] bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`h-8 w-8 rounded-lg ${actionBgColor(trade.side)} flex items-center justify-center shrink-0`}
          >
            <ActionIcon action={trade.side} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium line-clamp-1">
              {(trade as unknown as Record<string, unknown>).market_question
                ? String((trade as unknown as Record<string, unknown>).market_question)
                : trade.marketId}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-medium ${actionBgColor(trade.side)} ${actionColor(trade.side)}`}
              >
                {trade.side}
              </span>
              <span className="text-xs text-muted-foreground">
                {trade.outcome} @ {(trade.price * 100).toFixed(0)}c
              </span>
              <span className="text-xs text-muted-foreground">
                ${trade.size}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded ${
                  trade.status === "filled"
                    ? "bg-pm-green/15 text-pm-green"
                    : trade.status === "failed" || trade.status === "cancelled"
                      ? "bg-pm-red/15 text-pm-red"
                      : "bg-secondary text-muted-foreground"
                }`}
              >
                {trade.status}
              </span>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
          {relativeTime(trade.createdAt)}
        </span>
      </div>
    </div>
  );
}

function BotRunCard({
  run,
}: {
  run: BotRun & { botName?: string };
}) {
  return (
    <div className="border border-border rounded-[11px] bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`h-8 w-8 rounded-lg ${actionBgColor(run.action)} flex items-center justify-center shrink-0`}
          >
            <ActionIcon action={run.action} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium line-clamp-1">
                {run.marketQuestion || "Bot action"}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-medium ${actionBgColor(run.action)} ${actionColor(run.action)}`}
              >
                {run.action}
              </span>
              {run.botName && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-pm-blue/15 text-pm-blue flex items-center gap-1">
                  <Bot className="h-2.5 w-2.5" />
                  {run.botName}
                </span>
              )}
              {run.reason && (
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {run.reason}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
          {relativeTime(run.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ─── Page ───

export default function ActivityPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data: tradesData, isLoading: tradesLoading } = useQuery({
    queryKey: ["activity-trades", userId],
    queryFn: async () => {
      const res = await fetch(`/api/trade/history?userId=${userId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.trades || []) as Trade[];
    },
    enabled: !!userId,
  });

  const { data: botsData, isLoading: botsLoading } = useQuery({
    queryKey: ["activity-bots", userId],
    queryFn: async () => {
      const res = await fetch(`/api/bots?userId=${userId}`);
      if (!res.ok) return { bots: [], runs: [] };
      const json = await res.json();
      const bots: BotConfig[] = json.bots || [];

      // Fetch runs for each bot
      const runsResults = await Promise.all(
        bots.map(async (bot) => {
          const r = await fetch(`/api/bots/${bot.id}`);
          if (!r.ok) return [];
          const data = await r.json();
          return ((data.runs || []) as BotRun[]).map((run) => ({
            ...run,
            botName: bot.name,
          }));
        })
      );

      return {
        bots,
        runs: runsResults.flat(),
      };
    },
    enabled: !!userId,
  });

  const isLoading = tradesLoading || botsLoading;
  const trades = tradesData || [];
  const botRuns = botsData?.runs || [];

  // Build unified timeline sorted by most recent first
  const timeline: ActivityItem[] = [
    ...trades.map(
      (t): ActivityItem => ({
        type: "trade",
        data: t,
        timestamp: t.createdAt || (t as unknown as Record<string, unknown>).created_at as string || "",
      })
    ),
    ...botRuns.map(
      (r): ActivityItem => ({
        type: "bot_run",
        data: r,
        timestamp: r.createdAt || (r as Record<string, unknown>).created_at as string || "",
      })
    ),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-pm-blue" />
          Activity
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Recent trades and bot actions
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : timeline.length === 0 ? (
        <div className="border border-border rounded-[11px] bg-card py-16 text-center">
          <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No activity yet. Start trading or create a bot to see your feed.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {timeline.map((item) =>
            item.type === "trade" ? (
              <TradeCard key={`trade-${item.data.id}`} trade={item.data} />
            ) : (
              <BotRunCard key={`run-${item.data.id}`} run={item.data} />
            )
          )}
        </div>
      )}
    </div>
  );
}
