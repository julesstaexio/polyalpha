import { NextRequest, NextResponse } from "next/server";
import { storeCLOBCredentials } from "@/lib/polymarket/credentials";

const CLOB_URL =
  process.env.POLYMARKET_CLOB_URL || "https://clob.polymarket.com";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, walletAddress, signature, timestamp, nonce } = body;

  if (!userId || !walletAddress || !signature) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Derive API key from Polymarket CLOB
    const res = await fetch(`${CLOB_URL}/auth/derive-api-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: walletAddress,
        signature,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        nonce: nonce || 0,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json(
        { error: `CLOB auth failed: ${error}` },
        { status: res.status }
      );
    }

    const { apiKey, secret, passphrase } = await res.json();

    // Store encrypted credentials
    await storeCLOBCredentials(
      userId,
      walletAddress,
      apiKey,
      secret,
      passphrase
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Key derivation failed";
    console.error("Derive key error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
