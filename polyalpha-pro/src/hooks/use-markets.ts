"use client";

import { useQuery } from "@tanstack/react-query";
import type { PolymarketMarket } from "@/types";

interface MarketsResponse {
  markets: PolymarketMarket[];
  count: number;
}

export function useMarkets(
  limit = 50,
  offset = 0,
  category?: string,
  search?: string
) {
  return useQuery<MarketsResponse>({
    queryKey: ["markets", limit, offset, category, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (category && category !== "all") params.set("category", category);
      if (search) params.set("q", search);
      const res = await fetch(`/api/markets?${params}`);
      if (!res.ok) throw new Error("Failed to fetch markets");
      return res.json();
    },
  });
}

export function useMarket(conditionId: string) {
  return useQuery({
    queryKey: ["market", conditionId],
    queryFn: async () => {
      const res = await fetch(`/api/markets/${conditionId}`);
      if (!res.ok) throw new Error("Failed to fetch market");
      return res.json();
    },
    enabled: !!conditionId,
  });
}
