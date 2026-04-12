import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const conditionId = req.nextUrl.searchParams.get("conditionId");
  if (!conditionId) {
    return NextResponse.json({ error: "conditionId required" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("market_comments")
    .select("*")
    .eq("condition_id", conditionId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, userName, marketId, conditionId, content } = body;

  if (!userId || !conditionId || !content) {
    return NextResponse.json(
      { error: "userId, conditionId, and content required" },
      { status: 400 }
    );
  }

  if (content.length > 500) {
    return NextResponse.json(
      { error: "Comment too long (max 500 chars)" },
      { status: 400 }
    );
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("market_comments")
    .insert({
      user_id: userId,
      user_name: userName || "Anonymous",
      market_id: marketId || conditionId,
      condition_id: conditionId,
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment: data });
}
