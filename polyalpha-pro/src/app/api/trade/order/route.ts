import { NextRequest, NextResponse } from "next/server";
import { getCLOBCredentials } from "@/lib/polymarket/credentials";
import { placeCLOBOrder, cancelCLOBOrder } from "@/lib/polymarket/client";
import { clobRatelimit } from "@/lib/redis";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, tokenId, side, price, size, outcome, marketId, marketQuestion } = body;

  if (!userId || !tokenId || !side || !price || !size) {
    return NextResponse.json(
      { error: "Missing required fields: userId, tokenId, side, price, size" },
      { status: 400 }
    );
  }

  // Rate limit
  const { success } = await clobRatelimit.limit(userId);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  // Get user's CLOB credentials
  const credentials = await getCLOBCredentials(userId);
  if (!credentials) {
    return NextResponse.json(
      { error: "CLOB credentials not found. Please derive your API key first." },
      { status: 401 }
    );
  }

  // Validate order params
  if (price < 0.01 || price > 0.99) {
    return NextResponse.json(
      { error: "Price must be between 0.01 and 0.99" },
      { status: 400 }
    );
  }
  if (size <= 0) {
    return NextResponse.json(
      { error: "Size must be positive" },
      { status: 400 }
    );
  }

  try {
    // Place order on CLOB
    const clobOrder = await placeCLOBOrder(credentials, {
      tokenId,
      side,
      price,
      size,
    });

    // Record in database
    const supabase = createServerSupabase();
    const { data: trade, error: dbError } = await supabase
      .from("trades")
      .insert({
        user_id: userId,
        market_id: marketId || tokenId,
        condition_id: tokenId,
        market_question: marketQuestion,
        side,
        outcome: outcome || "Yes",
        price,
        size,
        status: "open",
        clob_order_id: clobOrder.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Trade DB error:", dbError);
    }

    return NextResponse.json({
      order: clobOrder,
      trade,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Order failed";
    console.error("Order placement error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { userId, orderId, tradeId } = body;

  if (!userId || !orderId) {
    return NextResponse.json(
      { error: "Missing userId or orderId" },
      { status: 400 }
    );
  }

  const credentials = await getCLOBCredentials(userId);
  if (!credentials) {
    return NextResponse.json(
      { error: "CLOB credentials not found" },
      { status: 401 }
    );
  }

  try {
    await cancelCLOBOrder(credentials, orderId);

    // Update trade status in DB
    if (tradeId) {
      const supabase = createServerSupabase();
      await supabase
        .from("trades")
        .update({ status: "cancelled" })
        .eq("id", tradeId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Cancel failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
