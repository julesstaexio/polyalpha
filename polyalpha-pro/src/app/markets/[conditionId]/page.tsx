"use client";

import { use } from "react";
import Image from "next/image";
import { useMarket } from "@/hooks/use-markets";
import { AIAnalysisPanel } from "@/components/markets/ai-analysis-panel";
import { OrderForm } from "@/components/trading/order-form";
import { DepositWithdraw } from "@/components/trading/deposit-withdraw";
import { DeriveKeys } from "@/components/trading/derive-keys";
import { OrderbookDisplay } from "@/components/markets/orderbook-display";
import { PriceChart } from "@/components/markets/price-chart";
import { CommentsSection } from "@/components/markets/comments-section";
import { ExternalLink, Loader2, Star, Clock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ conditionId: string }>;
}) {
  const { conditionId } = use(params);
  const { data, isLoading, error } = useMarket(conditionId);
  const { user } = useAuth();
  const userId = user?.id;
  const { isFavorite, toggle } = useFavorites();
  const starred = isFavorite(conditionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.market) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to markets
        </Link>
        <p className="text-center text-pm-red mt-10 text-sm">
          Market not found.
        </p>
      </div>
    );
  }

  const { market, orderbook } = data;
  const prob = market.probability ?? 0.5;
  const volume = market.volumeNum ?? 0;
  const liquidity = market.liquidityNum ?? 0;
  const tokenIds = market.clobTokenIds ? JSON.parse(market.clobTokenIds) : [];
  const yesTokenId = tokenIds[0] || conditionId;
  const yesPct = (prob * 100).toFixed(0);
  const noPct = ((1 - prob) * 100).toFixed(0);
  const imgSrc = market.icon || market.image;

  const polymarketUrl = `https://polymarket.com/event/${
    market.eventSlug || market.slug || market.id
  }`;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-6">
      {/* Market header */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-xl object-cover shrink-0"
              unoptimized
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-muted-foreground">
                {market.question.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold leading-tight text-foreground">
              {market.question}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              {market.category && (
                <span className="px-2 py-0.5 bg-secondary rounded text-xs">
                  {market.category}
                </span>
              )}
              <span>Vol. {formatVolume(volume)}</span>
              <span>Liq. {formatVolume(liquidity)}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(market.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggle(conditionId)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Star
                className={`h-5 w-5 ${starred ? "fill-pm-green text-pm-green" : ""}`}
              />
            </button>
            <a
              href={polymarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Polymarket
            </a>
          </div>
        </div>

        {/* Big outcome buttons */}
        <div className="flex items-center gap-3">
          <button className="flex-1 flex items-center justify-between h-12 px-5 rounded-[7px] bg-pm-green/15 hover:bg-pm-green/25 transition-colors">
            <span className="text-sm font-semibold text-pm-green">Buy Yes</span>
            <span className="text-2xl font-bold text-pm-green tabular-nums">
              {yesPct}¢
            </span>
          </button>
          <button className="flex-1 flex items-center justify-between h-12 px-5 rounded-[7px] bg-pm-red/15 hover:bg-pm-red/25 transition-colors">
            <span className="text-sm font-semibold text-pm-red">Buy No</span>
            <span className="text-2xl font-bold text-pm-red tabular-nums">
              {noPct}¢
            </span>
          </button>
        </div>
      </div>

      {/* Price chart — pass tokenId for real history */}
      <PriceChart probability={prob} conditionId={conditionId} tokenId={yesTokenId} />

      {/* 4-column layout: AI / Orderbook / Trade / Funds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3">
          <AIAnalysisPanel conditionId={conditionId} userId={userId} />
        </div>
        <div className="lg:col-span-3">
          <OrderbookDisplay orderbook={orderbook} />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <DeriveKeys />
          <OrderForm
            tokenId={yesTokenId}
            marketId={market.id}
            marketQuestion={market.question}
            currentPrice={prob}
            userId={userId}
          />
        </div>
        <div className="lg:col-span-3">
          <DepositWithdraw />
        </div>
      </div>

      {/* Comments */}
      <CommentsSection conditionId={conditionId} marketId={market.id} />
    </div>
  );
}
