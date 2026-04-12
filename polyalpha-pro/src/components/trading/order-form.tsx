"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useTradingStore } from "@/store";
import { Loader2 } from "lucide-react";

interface OrderFormProps {
  tokenId: string;
  marketId: string;
  marketQuestion: string;
  currentPrice: number;
  userId?: string;
}

export function OrderForm({
  tokenId,
  marketId,
  marketQuestion,
  currentPrice,
  userId,
}: OrderFormProps) {
  const { hasCLOBCredentials, isPlacingOrder, setIsPlacingOrder } =
    useTradingStore();
  const [outcome, setOutcome] = useState<"Yes" | "No">("Yes");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [price, setPrice] = useState(currentPrice.toFixed(2));
  const [amount, setAmount] = useState("10");
  const [error, setError] = useState<string | null>(null);

  const priceNum = parseFloat(price);
  const amountNum = parseFloat(amount);
  const shares = priceNum > 0 ? amountNum / priceNum : 0;
  const potentialPayout = side === "BUY" ? shares - amountNum : amountNum;

  async function handleSubmit() {
    if (!userId) {
      setError("Connect your wallet first");
      return;
    }
    if (!hasCLOBCredentials) {
      setError("Derive your CLOB API key first (Settings > Trading)");
      return;
    }

    setError(null);
    setIsPlacingOrder(true);

    try {
      const res = await fetch("/api/trade/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          tokenId,
          side,
          price: priceNum,
          size: amountNum,
          outcome,
          marketId,
          marketQuestion,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Order failed");
      }

      setAmount("10");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  const isYes = outcome === "Yes";
  const isBuy = side === "BUY";

  return (
    <div className="border border-border rounded-[11px] bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Trade</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Outcome toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setOutcome("Yes")}
            className={`flex-1 h-10 rounded-[7px] text-sm font-semibold transition-colors ${
              isYes
                ? "bg-pm-green/15 text-pm-green"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Yes
          </button>
          <button
            onClick={() => setOutcome("No")}
            className={`flex-1 h-10 rounded-[7px] text-sm font-semibold transition-colors ${
              !isYes
                ? "bg-pm-red/15 text-pm-red"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            No
          </button>
        </div>

        {/* Buy/Sell toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSide("BUY")}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors ${
              isBuy
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setSide("SELL")}
            className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-colors ${
              !isBuy
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Sell
          </button>
        </div>

        {/* Price */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Price</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max="0.99"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-9 text-sm bg-secondary border-0 rounded-lg"
            />
            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
              {(priceNum * 100).toFixed(0)}¢
            </span>
          </div>
          <Slider
            value={[priceNum * 100]}
            onValueChange={(v) =>
              setPrice(((Array.isArray(v) ? v[0] : v) / 100).toFixed(2))
            }
            min={1}
            max={99}
            step={1}
            className="py-1"
          />
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Amount (USDC)</label>
          <Input
            type="number"
            step="1"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 text-sm bg-secondary border-0 rounded-lg"
          />
          <div className="flex gap-1.5">
            {[5, 10, 25, 50, 100].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="flex-1 h-7 text-[11px] font-medium bg-secondary hover:bg-[#2f3842] rounded-md transition-colors text-muted-foreground"
              >
                ${v}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-secondary/50 rounded-lg p-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shares</span>
            <span className="font-medium tabular-nums">
              {shares.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Potential return</span>
            <span
              className={`font-medium tabular-nums ${
                potentialPayout > 0 ? "text-pm-green" : "text-pm-red"
              }`}
            >
              {potentialPayout > 0 ? "+" : ""}${potentialPayout.toFixed(2)}
            </span>
          </div>
        </div>

        {error && <p className="text-xs text-pm-red">{error}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isPlacingOrder || !priceNum || !amountNum}
          className={`w-full h-11 rounded-[7px] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isBuy
              ? "bg-pm-green text-white hover:bg-pm-green/90"
              : "bg-pm-red text-white hover:bg-pm-red/90"
          }`}
        >
          {isPlacingOrder ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            `${isBuy ? "Buy" : "Sell"} ${outcome} @ ${(priceNum * 100).toFixed(0)}¢`
          )}
        </button>
      </div>
    </div>
  );
}
