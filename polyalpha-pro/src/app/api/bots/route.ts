import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: bots, error } = await supabase
    .from("bot_configs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bots });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    userId,
    name,
    strategy,
    params,
    marketFilters,
    riskLimits,
  } = body;

  if (!userId || !name || !strategy) {
    return NextResponse.json(
      { error: "Missing required fields: userId, name, strategy" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();
  const { data: bot, error } = await supabase
    .from("bot_configs")
    .insert({
      user_id: userId,
      name,
      strategy,
      params: params || {},
      market_filters: marketFilters || {},
      risk_limits: riskLimits || {
        maxPositionPerMarket: 100,
        dailyLossLimit: 50,
        maxOpenPositions: 5,
        stopLossPercent: 20,
      },
      status: "stopped",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bot }, { status: 201 });
}
