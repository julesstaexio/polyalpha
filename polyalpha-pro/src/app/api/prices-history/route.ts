import { NextRequest, NextResponse } from "next/server";
import { getCached, setCache } from "@/lib/redis";

const CLOB_URL = process.env.POLYMARKET_CLOB_URL || "https://clob.polymarket.com";

interface PricePoint {
  t: number; // unix timestamp
  p: number; // price 0-1
}

/**
 * GET /api/prices-history?tokenId=xxx&interval=1m&fidelity=100
 *
 * Proxies to the Polymarket CLOB /prices-history endpoint
 * with Redis caching (5 min for daily, 30 min for longer intervals).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const tokenId = searchParams.get("tokenId");
  const interval = searchParams.get("interval") || "1m"; // 1d, 1w, 1m, 3m, 6m, 1y, max
  const fidelity = searchParams.get("fidelity") || "100";

  if (!tokenId) {
    return NextResponse.json({ error: "tokenId required" }, { status: 400 });
  }

  const cacheKey = `prices-history:${tokenId}:${interval}:${fidelity}`;
  const cached = await getCached<PricePoint[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ history: cached });
  }

  try {
    const url = `${CLOB_URL}/prices-history?market=${encodeURIComponent(tokenId)}&interval=${interval}&fidelity=${fidelity}`;
    const res = await fetch(url);

    if (!res.ok) {
      // Fallback: try the token-based endpoint
      const url2 = `${CLOB_URL}/prices-history?token_id=${encodeURIComponent(tokenId)}&interval=${interval}&fidelity=${fidelity}`;
      const res2 = await fetch(url2);

      if (!res2.ok) {
        return NextResponse.json(
          { error: `CLOB prices-history error: ${res2.status}`, history: [] },
          { status: 200 } // Return 200 with empty array so client can fall back to mock
        );
      }

      const data = await res2.json();
      const history: PricePoint[] = normalizeHistory(data);
      const ttl = interval === "1d" ? 300 : 1800; // 5min for daily, 30min otherwise
      await setCache(cacheKey, history, ttl);
      return NextResponse.json({ history });
    }

    const data = await res.json();
    const history: PricePoint[] = normalizeHistory(data);
    const ttl = interval === "1d" ? 300 : 1800;
    await setCache(cacheKey, history, ttl);
    return NextResponse.json({ history });
  } catch (err) {
    console.error("prices-history error:", err);
    return NextResponse.json({ history: [] }, { status: 200 });
  }
}

/**
 * Normalize various CLOB response formats into a consistent PricePoint[].
 */
function normalizeHistory(data: unknown): PricePoint[] {
  // Format 1: { history: [{ t, p }] }
  if (data && typeof data === "object" && "history" in data && Array.isArray((data as { history: unknown }).history)) {
    return ((data as { history: Array<{ t: number; p: number }> }).history).map((pt) => ({
      t: typeof pt.t === "number" ? pt.t : new Date(pt.t).getTime() / 1000,
      p: typeof pt.p === "number" ? pt.p : parseFloat(String(pt.p)),
    }));
  }

  // Format 2: direct array [{ t, p }]
  if (Array.isArray(data)) {
    return data.map((pt: { t: number | string; p: number | string }) => ({
      t: typeof pt.t === "number" ? pt.t : new Date(pt.t).getTime() / 1000,
      p: typeof pt.p === "number" ? pt.p : parseFloat(String(pt.p)),
    }));
  }

  return [];
}
