import { NextRequest, NextResponse } from "next/server";
import { fetchMarket, fetchOrderbook } from "@/lib/polymarket/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conditionId: string }> }
) {
  const { conditionId } = await params;

  try {
    const market = await fetchMarket(conditionId);
    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    // Fetch orderbook if clobTokenIds available
    let orderbook = null;
    if (market.clobTokenIds) {
      try {
        const tokenIds = JSON.parse(market.clobTokenIds);
        if (tokenIds[0]) {
          orderbook = await fetchOrderbook(tokenIds[0]);
        }
      } catch {
        // orderbook fetch failed, continue without it
      }
    }

    return NextResponse.json({ market, orderbook });
  } catch (error) {
    console.error("Market detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch market" },
      { status: 500 }
    );
  }
}
