"use client";

import Link from "next/link";
import Image from "next/image";
import type { PolymarketMarket } from "@/types";
import { Star } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export function MarketCard({ market }: { market: PolymarketMarket }) {
  const { isFavorite, toggle } = useFavorites();
  const starred = isFavorite(market.conditionId);
  const prob = market.probability ?? 0.5;
  const yesPct = (prob * 100).toFixed(0);
  const noPct = ((1 - prob) * 100).toFixed(0);
  const volume = market.volumeNum ?? 0;
  const imgSrc = market.icon || market.image;

  return (
    <div className="border border-border rounded-[11px] bg-card hover:border-[#3a4550] transition-colors">
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-start gap-3 mb-4">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover shrink-0"
              unoptimized
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-muted-foreground">
                {market.question.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <Link
            href={`/markets/${market.slug || market.conditionId}`}
            className="flex-1 min-w-0"
          >
            <h3 className="text-[15px] font-medium leading-snug line-clamp-2 text-foreground hover:underline cursor-pointer">
              {market.question}
            </h3>
          </Link>
        </div>

        {/* Outcome buttons */}
        <div className="flex items-center gap-2 mb-3">
          <Link
            href={`/markets/${market.slug || market.conditionId}`}
            className="flex-1 flex items-center justify-between gap-2 h-10 px-4 rounded-[7px] bg-pm-green/15 hover:bg-pm-green/25 transition-colors"
          >
            <span className="text-sm font-medium text-pm-green">Yes</span>
            <span className="text-[20px] font-semibold text-pm-green tabular-nums">
              {yesPct}¢
            </span>
          </Link>
          <Link
            href={`/markets/${market.slug || market.conditionId}`}
            className="flex-1 flex items-center justify-between gap-2 h-10 px-4 rounded-[7px] bg-pm-red/15 hover:bg-pm-red/25 transition-colors"
          >
            <span className="text-sm font-medium text-pm-red">No</span>
            <span className="text-[20px] font-semibold text-pm-red tabular-nums">
              {noPct}¢
            </span>
          </Link>
        </div>

        {/* Footer: volume + star */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Vol. {formatVolume(volume)}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(market.conditionId);
            }}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Star
              className={`h-4 w-4 ${starred ? "fill-pm-green text-pm-green" : ""}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
