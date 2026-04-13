"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceChartProps {
  probability: number;
  conditionId: string;
  tokenId?: string;
}

interface ChartPoint {
  date: string;
  price: number;
  timestamp: number;
}

const INTERVALS = [
  { label: "1H", value: "1h", fidelity: 60 },
  { label: "6H", value: "6h", fidelity: 72 },
  { label: "1D", value: "1d", fidelity: 96 },
  { label: "1W", value: "1w", fidelity: 168 },
  { label: "1M", value: "1m", fidelity: 120 },
  { label: "All", value: "max", fidelity: 200 },
] as const;

function generateMockHistory(currentProb: number, days: number = 30): ChartPoint[] {
  const data: ChartPoint[] = [];
  let p = currentProb + (Math.random() - 0.5) * 0.3;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    p += (Math.random() - 0.5) * 0.04;
    p = Math.max(0.02, Math.min(0.98, p));
    if (i === 0) p = currentProb;
    const ts = now - i * 86400000;
    data.push({
      date: new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: Math.round(p * 100),
      timestamp: ts,
    });
  }
  return data;
}

function formatDate(ts: number, interval: string): string {
  const d = new Date(ts * 1000);
  if (interval === "1d") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PriceChart({ probability, conditionId, tokenId }: PriceChartProps) {
  const [interval, setInterval] = useState<string>("1m");
  const selectedInterval = INTERVALS.find((i) => i.value === interval) || INTERVALS[2];

  // Fetch real price history from our API
  const queryId = tokenId || conditionId;
  const { data: realHistory } = useQuery({
    queryKey: ["prices-history", queryId, interval],
    queryFn: async () => {
      const res = await fetch(
        `/api/prices-history?tokenId=${encodeURIComponent(queryId)}&interval=${interval}&fidelity=${selectedInterval.fidelity}`
      );
      if (!res.ok) return null;
      const json = await res.json();
      return json.history as { t: number; p: number }[] | null;
    },
    staleTime: interval === "1d" ? 60_000 : 300_000,
  });

  const data = useMemo(() => {
    // Use real data if available and non-empty
    if (realHistory && realHistory.length > 2) {
      return realHistory.map((pt) => ({
        date: formatDate(pt.t, interval),
        price: Math.round(pt.p * 100),
        timestamp: pt.t,
      }));
    }
    // Fallback to mock
    return generateMockHistory(probability);
  }, [realHistory, probability, interval]);

  const isUp = data.length >= 2 && data[data.length - 1].price >= data[0].price;
  const color = isUp ? "#3db468" : "#cb3131";
  const isReal = !!(realHistory && realHistory.length > 2);

  return (
    <div className="border border-border rounded-[11px] bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Price History</h3>
          {!isReal && (
            <span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded text-muted-foreground">
              simulated
            </span>
          )}
        </div>
        {/* Interval selector */}
        <div className="flex gap-0.5">
          {INTERVALS.map((iv) => (
            <button
              key={iv.value}
              onClick={() => setInterval(iv.value)}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                interval === iv.value
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${conditionId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#7b8996" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#7b8996" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}¢`}
              width={35}
            />
            <Tooltip
              contentStyle={{
                background: "#1c2127",
                border: "1px solid #242b32",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#7b8996" }}
              formatter={(value) => [`${Number(value)}¢`, "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${conditionId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
