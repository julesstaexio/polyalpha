// ─── Polymarket Domain Types ───

export interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  eventSlug: string;
  conditionId: string;
  category: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  outcomePrices: string; // JSON string: ["0.65", "0.35"]
  volume: string;
  liquidity: string;
  outcomes: string[]; // ["Yes", "No"]
  clobTokenIds?: string; // JSON string: ["tokenId1", "tokenId2"]
  image?: string;
  icon?: string;
  // Computed fields
  probability?: number;
  volumeNum?: number;
  liquidityNum?: number;
}

export interface OrderbookEntry {
  price: string;
  size: string;
}

export interface Orderbook {
  market: string;
  asset_id: string;
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  hash: string;
  timestamp: string;
}

export interface CLOBOrder {
  id: string;
  market: string;
  asset_id: string;
  side: "BUY" | "SELL";
  original_size: string;
  size_matched: string;
  price: string;
  status: "live" | "matched" | "cancelled";
  outcome: "Yes" | "No";
  created_at: string;
}

export interface Position {
  asset: string;
  conditionId: string;
  size: string;
  avgPrice: string;
  currentPrice: string;
  pnl: number;
  pnlPercent: number;
  market?: PolymarketMarket;
}

// ─── AI Analysis Types ───

export interface MarketAnalysis {
  summary: string;
  signal: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  aiProbability: number;
  marketProbability: number;
  edge: number;
  sentiment: "bullish" | "bearish" | "mixed";
  keyFactors: string[];
  risks: string[];
  dataPoints: {
    volumeTrend: "increasing" | "decreasing" | "stable";
    liquidityDepth: "deep" | "moderate" | "thin";
    smartMoneyFlow: string;
    newsImpact: string;
  };
  quantSignals: QuantSignal[];
  updatedAt: string;
}

export interface QuantSignal {
  name: string;
  value: number;
  signal: "bullish" | "bearish" | "neutral";
  weight: number;
  description: string;
}

// ─── Bot Types ───

export type BotStrategy =
  | "threshold"
  | "mean_reversion"
  | "momentum"
  | "ai_signal"
  | "custom";

export interface BotConfig {
  id: string;
  userId: string;
  name: string;
  strategy: BotStrategy;
  params: Record<string, number | string | boolean>;
  marketFilters: {
    categories?: string[];
    minVolume?: number;
    minLiquidity?: number;
    maxEndDate?: string;
  };
  riskLimits: {
    maxPositionPerMarket: number;
    dailyLossLimit: number;
    maxOpenPositions: number;
    stopLossPercent: number;
  };
  status: "running" | "stopped" | "error" | "paused";
  totalPnl?: number;
  totalTrades?: number;
  winRate?: number;
  lastRunAt?: string;
  createdAt: string;
}

export interface BotRun {
  id: string;
  botId: string;
  action: "BUY" | "SELL" | "SKIP" | "ERROR";
  marketId?: string;
  marketQuestion?: string;
  reason: string;
  tradeId?: string;
  pnl?: number;
  createdAt: string;
}

// ─── Trade Types ───

export interface Trade {
  id: string;
  userId: string;
  marketId: string;
  conditionId: string;
  side: "BUY" | "SELL";
  outcome: "Yes" | "No";
  price: number;
  size: number;
  filledSize: number;
  status: "pending" | "open" | "filled" | "cancelled" | "failed";
  clobOrderId?: string;
  txHash?: string;
  createdAt: string;
}

// ─── Strategy Parameter Schemas ───

export interface ThresholdParams {
  buyBelow: number;
  sellAbove: number;
  orderSize: number;
}

export interface MeanReversionParams {
  lookbackPeriod: number;
  stdDevs: number;
  orderSize: number;
}

export interface MomentumParams {
  momentumWindow: number;
  minMove: number;
  orderSize: number;
}

export interface AISignalParams {
  minConfidence: number;
  minEdge: number;
  orderSize: number;
}
