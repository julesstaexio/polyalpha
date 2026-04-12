import { NextRequest } from "next/server";
import { fetchMarket, fetchOrderbook } from "@/lib/polymarket/client";
import { streamAnalysis } from "@/lib/ai/analyze";
import { analysisRatelimit } from "@/lib/redis";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { conditionId, userId } = body;

  if (!conditionId) {
    return new Response(
      JSON.stringify({ error: "conditionId required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rate limit
  if (userId) {
    const { success } = await analysisRatelimit.limit(userId);
    if (!success) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again in 1 minute." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const market = await fetchMarket(conditionId);
  if (!market) {
    return new Response(
      JSON.stringify({ error: "Market not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Fetch orderbook for deeper analysis
  let orderbook = undefined;
  if (market.clobTokenIds) {
    try {
      const tokenIds = JSON.parse(market.clobTokenIds);
      if (tokenIds[0]) {
        orderbook = await fetchOrderbook(tokenIds[0]);
      }
    } catch {
      // continue without orderbook
    }
  }

  // Stream via SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamAnalysis(market, orderbook, (chunk) => {
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Analysis failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", data: msg })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
