import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCached, setCache } from "@/lib/redis";

interface LeaderboardRow {
  user_id: string;
  wallet_address: string;
  username: string | null;
  total_pnl: number;
  win_count: number;
  loss_count: number;
  total_trades: number;
  win_rate: number;
  pnl_7d: number;
  pnl_prev_7d: number;
  trend: "up" | "down" | "flat";
}

const CACHE_TTL = 300; // 5 minutes

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const period = params.get("period") || "all"; // "7d" | "30d" | "all"
  const limit = Math.min(parseInt(params.get("limit") || "50"), 100);

  if (!["7d", "30d", "all"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const cacheKey = `polyalpha:leaderboard:${period}:${limit}`;
  const cached = await getCached<LeaderboardRow[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ leaderboard: cached, cached: true });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_period: period,
    p_limit: limit,
  });

  if (error) {
    console.error("Leaderboard RPC error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }

  const leaderboard: LeaderboardRow[] = (data ?? []).map(
    (row: LeaderboardRow, i: number) => ({
      rank: i + 1,
      ...row,
    })
  );

  await setCache(cacheKey, leaderboard, CACHE_TTL);

  return NextResponse.json({ leaderboard, cached: false });
}
