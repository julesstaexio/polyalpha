import type { PolymarketMarket, Orderbook, CLOBOrder } from "@/types";
import { getCached, setCache } from "@/lib/redis";

const GAMMA_URL =
  process.env.NEXT_PUBLIC_POLYMARKET_GAMMA_URL ||
  "https://gamma-api.polymarket.com";
const CLOB_URL =
  process.env.POLYMARKET_CLOB_URL || "https://clob.polymarket.com";

// ─── Gamma API (public market data) ───

export async function fetchMarkets(
  limit = 100,
  offset = 0,
  category?: string
): Promise<PolymarketMarket[]> {
  const cacheKey = `markets:${limit}:${offset}:${category || "all"}`;
  const cached = await getCached<PolymarketMarket[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    active: "true",
    closed: "false",
    order: "volume",
    ascending: "false",
  });
  if (category) params.set("tag", category);

  const res = await fetch(`${GAMMA_URL}/markets?${params}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Gamma API error: ${res.status}`);

  const markets: PolymarketMarket[] = await res.json();

  const enriched = markets.map((m) => ({
    ...m,
    probability: parseProbability(m.outcomePrices),
    volumeNum: parseFloat(m.volume || "0"),
    liquidityNum: parseFloat(m.liquidity || "0"),
  }));

  await setCache(cacheKey, enriched, 30);
  return enriched;
}

export async function fetchMarket(
  conditionId: string
): Promise<PolymarketMarket | null> {
  const cacheKey = `market:${conditionId}`;
  const cached = await getCached<PolymarketMarket>(cacheKey);
  if (cached) return cached;

  // Gamma API lookup strategy:
  //   numeric → GET /markets/{id}
  //   0x...   → GET /markets?clob_token_ids=... (fallback: search all)
  //   slug    → GET /markets/slug/{slug}  (official endpoint per docs)
  let market: PolymarketMarket | null = null;

  if (/^\d+$/.test(conditionId)) {
    // Numeric id — direct lookup
    const res = await fetch(`${GAMMA_URL}/markets/${conditionId}`);
    if (res.ok) {
      market = await res.json();
    }
  } else if (conditionId.startsWith("0x")) {
    // conditionId hex — search in bulk as Gamma has no exact conditionId endpoint
    const res = await fetch(
      `${GAMMA_URL}/markets?limit=200&active=true&closed=false`
    );
    if (res.ok) {
      const all: PolymarketMarket[] = await res.json();
      market = all.find((m) => m.conditionId === conditionId) || null;
    }
  } else {
    // Slug — use official /markets/slug/{slug} endpoint
    const res = await fetch(
      `${GAMMA_URL}/markets/slug/${encodeURIComponent(conditionId)}`
    );
    if (res.ok) {
      market = await res.json();
    }
  }

  if (!market) return null;

  const enriched = {
    ...market,
    probability: parseProbability(market.outcomePrices),
    volumeNum: parseFloat(market.volume || "0"),
    liquidityNum: parseFloat(market.liquidity || "0"),
  };

  await setCache(cacheKey, enriched, 15);
  return enriched;
}

export async function searchMarkets(
  query: string
): Promise<PolymarketMarket[]> {
  const res = await fetch(
    `${GAMMA_URL}/markets?_q=${encodeURIComponent(query)}&limit=20&active=true`
  );
  if (!res.ok) return [];
  return res.json();
}

// ─── CLOB API (orderbook + trading) ───

export async function fetchOrderbook(tokenId: string): Promise<Orderbook> {
  const cacheKey = `orderbook:${tokenId}`;
  const cached = await getCached<Orderbook>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${CLOB_URL}/book?token_id=${tokenId}`);
  if (!res.ok) throw new Error(`CLOB orderbook error: ${res.status}`);

  const book: Orderbook = await res.json();
  await setCache(cacheKey, book, 5);
  return book;
}

export async function fetchMidpoint(tokenId: string): Promise<number> {
  const res = await fetch(`${CLOB_URL}/midpoint?token_id=${tokenId}`);
  if (!res.ok) throw new Error(`CLOB midpoint error: ${res.status}`);
  const data = await res.json();
  return parseFloat(data.mid);
}

export async function fetchPrice(
  tokenId: string,
  side: "BUY" | "SELL"
): Promise<number> {
  const res = await fetch(
    `${CLOB_URL}/price?token_id=${tokenId}&side=${side}`
  );
  if (!res.ok) throw new Error(`CLOB price error: ${res.status}`);
  const data = await res.json();
  return parseFloat(data.price);
}

// ─── CLOB Authenticated (trading) ───
// Per Polymarket docs: L2 auth uses HMAC-SHA256 headers
// Headers: POLY_ADDRESS, POLY_API_KEY, POLY_PASSPHRASE, POLY_TIMESTAMP, POLY_SIGNATURE

import { createHmac } from "crypto";

interface CLOBCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
  address?: string; // wallet address needed for L2 headers
}

/**
 * Generate L2 HMAC-SHA256 authentication headers per Polymarket docs.
 */
function buildL2Headers(
  credentials: CLOBCredentials,
  method: string,
  path: string,
  body?: string
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = timestamp + method.toUpperCase() + path + (body || "");
  const signature = createHmac("sha256", credentials.secret)
    .update(message)
    .digest("base64");

  return {
    POLY_ADDRESS: credentials.address || "",
    POLY_API_KEY: credentials.apiKey,
    POLY_PASSPHRASE: credentials.passphrase,
    POLY_TIMESTAMP: timestamp,
    POLY_SIGNATURE: signature,
  };
}

export async function placeCLOBOrder(
  credentials: CLOBCredentials,
  params: {
    tokenId: string;
    side: "BUY" | "SELL";
    price: number;
    size: number;
    type?: "GTC" | "FOK" | "GTD" | "FAK";
  }
): Promise<CLOBOrder> {
  const orderBody = JSON.stringify({
    token_id: params.tokenId,
    side: params.side,
    price: params.price,
    size: params.size,
    type: params.type || "GTC",
  });

  const headers = buildL2Headers(credentials, "POST", "/order", orderBody);

  const res = await fetch(`${CLOB_URL}/order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: orderBody,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`CLOB order error: ${res.status} - ${error}`);
  }

  return res.json();
}

export async function cancelCLOBOrder(
  credentials: CLOBCredentials,
  orderId: string
): Promise<void> {
  const path = `/order/${orderId}`;
  const headers = buildL2Headers(credentials, "DELETE", path);

  const res = await fetch(`${CLOB_URL}${path}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`CLOB cancel error: ${res.status} - ${error}`);
  }
}

export async function fetchOpenOrders(
  credentials: CLOBCredentials,
  market?: string
): Promise<CLOBOrder[]> {
  const queryParams = new URLSearchParams();
  if (market) queryParams.set("market", market);
  const path = `/orders?${queryParams}`;
  const headers = buildL2Headers(credentials, "GET", path);

  const res = await fetch(`${CLOB_URL}${path}`, {
    headers,
  });

  if (!res.ok) throw new Error(`CLOB orders error: ${res.status}`);
  return res.json();
}

// ─── Helpers ───

function parseProbability(outcomePrices: string | undefined): number {
  if (!outcomePrices) return 0.5;
  try {
    const prices = JSON.parse(outcomePrices);
    return parseFloat(prices[0]) || 0.5;
  } catch {
    return 0.5;
  }
}
