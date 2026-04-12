import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, telegramChatId, notifyTrades, notifyBots, notifyAlerts } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: userId,
        telegram_chat_id: telegramChatId || null,
        notification_telegram: !!(telegramChatId && (notifyTrades || notifyBots || notifyAlerts)),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
