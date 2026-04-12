"use client";

import { create } from "zustand";
import type { PolymarketMarket, MarketAnalysis, BotConfig, Trade } from "@/types";

// ─── Market Store ───

interface MarketState {
  markets: PolymarketMarket[];
  selectedMarket: PolymarketMarket | null;
  searchQuery: string;
  categoryFilter: string;
  sortBy: "volume" | "liquidity" | "newest" | "ending_soon";
  isLoading: boolean;
  setMarkets: (markets: PolymarketMarket[]) => void;
  setSelectedMarket: (market: PolymarketMarket | null) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  setSortBy: (sort: MarketState["sortBy"]) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  markets: [],
  selectedMarket: null,
  searchQuery: "",
  categoryFilter: "all",
  sortBy: "volume",
  isLoading: false,
  setMarkets: (markets) => set({ markets }),
  setSelectedMarket: (market) => set({ selectedMarket: market }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setIsLoading: (loading) => set({ isLoading: loading }),
}));

// ─── Analysis Store ───

interface AnalysisState {
  analyses: Record<string, MarketAnalysis>;
  activeAnalysis: string | null;
  isAnalyzing: boolean;
  streamingText: string;
  setAnalysis: (marketId: string, analysis: MarketAnalysis) => void;
  setActiveAnalysis: (marketId: string | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (text: string) => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analyses: {},
  activeAnalysis: null,
  isAnalyzing: false,
  streamingText: "",
  setAnalysis: (marketId, analysis) =>
    set((state) => ({
      analyses: { ...state.analyses, [marketId]: analysis },
    })),
  setActiveAnalysis: (marketId) => set({ activeAnalysis: marketId }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setStreamingText: (text) => set({ streamingText: text }),
  appendStreamingText: (text) =>
    set((state) => ({ streamingText: state.streamingText + text })),
}));

// ─── Trading Store ───

interface TradingState {
  openOrders: Trade[];
  positions: { marketId: string; size: number; avgPrice: number; pnl: number }[];
  hasCLOBCredentials: boolean;
  isPlacingOrder: boolean;
  setOpenOrders: (orders: Trade[]) => void;
  setPositions: (positions: TradingState["positions"]) => void;
  setHasCLOBCredentials: (has: boolean) => void;
  setIsPlacingOrder: (placing: boolean) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  openOrders: [],
  positions: [],
  hasCLOBCredentials: false,
  isPlacingOrder: false,
  setOpenOrders: (orders) => set({ openOrders: orders }),
  setPositions: (positions) => set({ positions }),
  setHasCLOBCredentials: (has) => set({ hasCLOBCredentials: has }),
  setIsPlacingOrder: (placing) => set({ isPlacingOrder: placing }),
}));

// ─── Bot Store ───

interface BotState {
  bots: BotConfig[];
  selectedBot: BotConfig | null;
  setBots: (bots: BotConfig[]) => void;
  setSelectedBot: (bot: BotConfig | null) => void;
  updateBot: (id: string, updates: Partial<BotConfig>) => void;
}

export const useBotStore = create<BotState>((set) => ({
  bots: [],
  selectedBot: null,
  setBots: (bots) => set({ bots }),
  setSelectedBot: (bot) => set({ selectedBot: bot }),
  updateBot: (id, updates) =>
    set((state) => ({
      bots: state.bots.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),
}));
