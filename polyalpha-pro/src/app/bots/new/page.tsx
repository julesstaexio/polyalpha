"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Bot,
  Loader2,
  Save,
  Target,
  TrendingUp,
  Zap,
  Brain,
} from "lucide-react";
import Link from "next/link";
import type { BotStrategy } from "@/types";

const STRATEGIES: {
  value: BotStrategy;
  label: string;
  description: string;
  icon: typeof Target;
}[] = [
  {
    value: "threshold",
    label: "Threshold",
    description: "Buy when price drops below X, sell when it rises above Y",
    icon: Target,
  },
  {
    value: "mean_reversion",
    label: "Mean Reversion",
    description: "Fade moves away from fair value using standard deviations",
    icon: TrendingUp,
  },
  {
    value: "momentum",
    label: "Momentum",
    description: "Follow price direction when movement exceeds threshold",
    icon: Zap,
  },
  {
    value: "ai_signal",
    label: "AI Signal",
    description: "Trade based on AI analysis confidence and edge signals",
    icon: Brain,
  },
];

const CATEGORIES = [
  "crypto",
  "politics",
  "sports",
  "economics",
  "tech",
  "entertainment",
];

export default function NewBotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState<BotStrategy>("threshold");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minVolume, setMinVolume] = useState(10000);
  const [minLiquidity, setMinLiquidity] = useState(5000);

  const [buyBelow, setBuyBelow] = useState(0.35);
  const [sellAbove, setSellAbove] = useState(0.65);
  const [orderSize, setOrderSize] = useState(10);

  const [maxPosition, setMaxPosition] = useState(200);
  const [dailyLoss, setDailyLoss] = useState(100);
  const [maxPositions, setMaxPositions] = useState(5);
  const [stopLoss, setStopLoss] = useState(20);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleCreate() {
    if (!user?.id || !name) return;
    setIsCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name,
          strategy,
          params: { buyBelow, sellAbove, orderSize },
          marketFilters: {
            categories:
              selectedCategories.length > 0 ? selectedCategories : undefined,
            minVolume,
            minLiquidity,
          },
          riskLimits: {
            maxPositionPerMarket: maxPosition,
            dailyLossLimit: dailyLoss,
            maxOpenPositions: maxPositions,
            stopLossPercent: stopLoss,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create bot");
      }

      const { bot } = await res.json();
      router.push(`/bots/${bot.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bot");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
      <Link
        href="/bots"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Bots
      </Link>

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Bot className="h-5 w-5 text-pm-blue" />
          Create Trading Bot
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure an automated strategy to trade Polymarket
        </p>
      </div>

      {/* Name */}
      <div className="border border-border rounded-[11px] bg-card p-4 space-y-2">
        <label className="text-sm font-semibold">Bot Name</label>
        <Input
          placeholder="e.g., Crypto Fade Bot"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 bg-secondary border-0 rounded-lg"
        />
      </div>

      {/* Strategy Selection */}
      <div className="border border-border rounded-[11px] bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Strategy</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STRATEGIES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStrategy(s.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  strategy === s.value
                    ? "border-pm-blue bg-pm-blue/10"
                    : "border-border hover:border-[#3a4550]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <s.icon
                    className={`h-4 w-4 ${
                      strategy === s.value
                        ? "text-pm-blue"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Params */}
      <div className="border border-border rounded-[11px] bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Strategy Parameters</h3>
        </div>
        <div className="p-4 space-y-4">
          {strategy === "threshold" && (
            <>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Buy below: {(buyBelow * 100).toFixed(0)}%
                </label>
                <Slider
                  value={[buyBelow * 100]}
                  onValueChange={(v) =>
                    setBuyBelow((Array.isArray(v) ? v[0] : v) / 100)
                  }
                  min={5}
                  max={45}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Sell above: {(sellAbove * 100).toFixed(0)}%
                </label>
                <Slider
                  value={[sellAbove * 100]}
                  onValueChange={(v) =>
                    setSellAbove((Array.isArray(v) ? v[0] : v) / 100)
                  }
                  min={55}
                  max={95}
                  step={1}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">
              Order size (USDC)
            </label>
            <Input
              type="number"
              value={orderSize}
              onChange={(e) => setOrderSize(Number(e.target.value))}
              className="h-9 text-sm bg-secondary border-0 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Market Filters */}
      <div className="border border-border rounded-[11px] bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Market Filters</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              Categories
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategories.includes(cat)
                      ? "bg-pm-blue text-white"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Min Volume ($)
              </label>
              <Input
                type="number"
                value={minVolume}
                onChange={(e) => setMinVolume(Number(e.target.value))}
                className="h-9 text-sm bg-secondary border-0 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Min Liquidity ($)
              </label>
              <Input
                type="number"
                value={minLiquidity}
                onChange={(e) => setMinLiquidity(Number(e.target.value))}
                className="h-9 text-sm bg-secondary border-0 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Risk Management */}
      <div className="border border-border border-pm-red/20 rounded-[11px] bg-card">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-pm-red">
            Risk Management
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Max per market ($)
              </label>
              <Input
                type="number"
                value={maxPosition}
                onChange={(e) => setMaxPosition(Number(e.target.value))}
                className="h-9 text-sm bg-secondary border-0 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Daily loss limit ($)
              </label>
              <Input
                type="number"
                value={dailyLoss}
                onChange={(e) => setDailyLoss(Number(e.target.value))}
                className="h-9 text-sm bg-secondary border-0 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Max open positions
              </label>
              <Input
                type="number"
                value={maxPositions}
                onChange={(e) => setMaxPositions(Number(e.target.value))}
                className="h-9 text-sm bg-secondary border-0 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Stop loss (%)
              </label>
              <Input
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="h-9 text-sm bg-secondary border-0 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-pm-red">{error}</p>}

      {/* Create */}
      <button
        onClick={handleCreate}
        disabled={!name || isCreating || !user?.id}
        className="w-full h-11 rounded-[7px] text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isCreating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Create Bot
      </button>
    </div>
  );
}
