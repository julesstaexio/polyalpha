import { NextRequest, NextResponse } from "next/server";
import { fetchMarkets, searchMarkets } from "@/lib/polymarket/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = params.get("q");
  const limit = parseInt(params.get("limit") || "50");
  const offset = parseInt(params.get("offset") || "0");
  const category = params.get("category") || undefined;

  try {
    const markets = query
      ? await searchMarkets(query)
      : await fetchMarkets(limit, offset, category);

    return NextResponse.json({ markets, count: markets.length });
  } catch (error) {
    console.error("Markets API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}
