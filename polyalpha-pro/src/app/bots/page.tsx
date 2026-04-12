"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useBotStore } from "@/store";
import {
  Bot,
  Plus,
  Play,
  Square,
  Trash2,
  TrendingUp,
  TrendingDown,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import type { BotConfig } from "@/types";

function StatusBadge({ status }: { status: BotConfig["status"] }) {
  const styles = {
    running: "bg-pm-green/15 text-pm-green",
    stopped: "bg-secondary text-muted-foreground",
    error: "bg-pm-red/15 text-pm-red",
    paused: "bg-[#f0b90b]/15 text-[#f0b90b]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${styles[status]}`}
    >
      {status === "running" && (
        <span className="h-1.5 w-1.5 rounded-full bg-pm-green animate-pulse" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const strategyLabels: Record<string, string> = {
  threshold: "Threshold",
  mean_reversion: "Mean Reversion",
  momentum: "Momentum",
  ai_signal: "AI Signal",
  custom: "Custom",
};

export default function BotsPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const { bots, setBots } = useBotStore();

  const { data } = useQuery({
    queryKey: ["bots", userId],
    queryFn: async () => {
      const res = await fetch(`/api/bots?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch bots");
      return res.json();
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (data?.bots) setBots(data.bots);
  }, [data, setBots]);

  async function toggleBot(bot: BotConfig) {
    const newStatus = bot.status === "running" ? "stopped" : "running";
    await fetch(`/api/bots/${bot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBots(
      bots.map((b) => (b.id === bot.id ? { ...b, status: newStatus } : b))
    );
  }

  async function deleteBot(botId: string) {
    await fetch(`/api/bots/${botId}`, { method: "DELETE" });
    setBots(bots.filter((b) => b.id !== botId));
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot className="h-5 w-5 text-pm-blue" />
            Trading Bots
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create and manage automated trading strategies
          </p>
        </div>
        <Link
          href="/bots/new"
          className="flex items-center gap-1.5 px-4 h-9 text-sm font-semibold bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Bot
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Active Bots",
            value: bots.filter((b) => b.status === "running").length,
            icon: Play,
          },
          {
            label: "Total Bots",
            value: bots.length,
            icon: Bot,
          },
          {
            label: "Total P&L",
            value: `$${bots.reduce((sum, b) => sum + (Number(b.totalPnl) || 0), 0).toFixed(2)}`,
            icon: TrendingUp,
          },
          {
            label: "Total Trades",
            value: bots.reduce(
              (sum, b) => sum + (Number(b.totalTrades) || 0),
              0
            ),
            icon: Settings2,
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
            <div className="text-xl font-bold tabular-nums">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Bot list */}
      {bots.length === 0 ? (
        <div className="border border-border rounded-[11px] bg-card py-16 text-center">
          <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No trading bots yet. Create your first bot to get started.
          </p>
          <Link
            href="/bots/new"
            className="inline-flex items-center gap-1.5 px-4 h-9 text-sm font-semibold bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Bot
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="border border-border rounded-[11px] bg-card hover:border-[#3a4550] transition-colors p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-pm-blue/15 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-pm-blue" />
                  </div>
                  <div>
                    <Link
                      href={`/bots/${bot.id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {bot.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 bg-secondary rounded text-muted-foreground">
                        {strategyLabels[bot.strategy] || bot.strategy}
                      </span>
                      <StatusBadge status={bot.status} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* P&L */}
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-muted-foreground">P&L</div>
                    <div
                      className={`text-sm font-bold tabular-nums ${
                        (Number(bot.totalPnl) || 0) >= 0
                          ? "text-pm-green"
                          : "text-pm-red"
                      }`}
                    >
                      {(Number(bot.totalPnl) || 0) >= 0 ? (
                        <TrendingUp className="inline h-3 w-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="inline h-3 w-3 mr-0.5" />
                      )}
                      ${Math.abs(Number(bot.totalPnl) || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleBot(bot)}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {bot.status === "running" ? (
                        <Square className="h-3.5 w-3.5 text-[#f0b90b]" />
                      ) : (
                        <Play className="h-3.5 w-3.5 text-pm-green" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteBot(bot.id)}
                      className="p-2 text-muted-foreground hover:text-pm-red transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
