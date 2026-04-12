"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Polls the markets API at a set interval to keep prices fresh.
 * Invalidates the TanStack Query cache so all market data auto-refreshes.
 */
export function useRealtimePrices(intervalMs: number = 30000) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [queryClient, intervalMs]);
}
