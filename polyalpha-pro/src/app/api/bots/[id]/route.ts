import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const [botResult, runsResult] = await Promise.all([
    supabase.from("bot_configs").select("*").eq("id", id).single(),
    supabase
      .from("bot_runs")
      .select("*")
      .eq("bot_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (botResult.error) {
    return NextResponse.json(
      { error: botResult.error.message },
      { status: 404 }
    );
  }

  return NextResponse.json({
    bot: botResult.data,
    runs: runsResult.data || [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createServerSupabase();

  const { data: bot, error } = await supabase
    .from("bot_configs")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bot });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerSupabase();

  // Stop bot first if running
  await supabase
    .from("bot_configs")
    .update({ status: "stopped" })
    .eq("id", id);

  const { error } = await supabase.from("bot_configs").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
