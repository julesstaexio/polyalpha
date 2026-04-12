"use client";

import { useMemo } from "react";
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
}

function generateMockHistory(currentProb: number, days: number = 30) {
  const data = [];
  let p = currentProb + (Math.random() - 0.5) * 0.3;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    p += (Math.random() - 0.5) * 0.04;
    p = Math.max(0.02, Math.min(0.98, p));
    if (i === 0) p = currentProb;
    data.push({
      date: new Date(now - i * 86400000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      price: Math.round(p * 100),
    });
  }
  return data;
}

export function PriceChart({ probability, conditionId }: PriceChartProps) {
  const data = useMemo(
    () => generateMockHistory(probability),
    [probability, conditionId]
  );

  const isUp = data.length >= 2 && data[data.length - 1].price >= data[0].price;
  const color = isUp ? "#3db468" : "#cb3131";

  return (
    <div className="border border-border rounded-[11px] bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Price History</h3>
        <span className="text-xs text-muted-foreground">30d</span>
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
