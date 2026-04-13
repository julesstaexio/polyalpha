import { NextRequest, NextResponse } from "next/server";
import { storeCLOBCredentials } from "@/lib/polymarket/credentials";

const CLOB_URL =
  process.env.POLYMARKET_CLOB_URL || "https://clob.polymarket.com";

/**
 * POST /api/trade/derive-key
 *
 * Client sends: { userId, walletAddress, signature, timestamp, nonce }
 * Server calls Polymarket GET /auth/derive-api-key with L1 headers:
 *   POLY_ADDRESS, POLY_SIGNATURE, POLY_TIMESTAMP, POLY_NONCE
 * Then stores the returned credentials encrypted in Supabase.
 */
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
    const ts = String(timestamp || Math.floor(Date.now() / 1000));
    const n = String(nonce ?? 0);

    // Per Polymarket docs: GET /auth/derive-api-key with L1 headers
    const res = await fetch(`${CLOB_URL}/auth/derive-api-key`, {
      method: "GET",
      headers: {
        POLY_ADDRESS: walletAddress,
        POLY_SIGNATURE: signature,
        POLY_TIMESTAMP: ts,
        POLY_NONCE: n,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("CLOB derive-api-key error:", res.status, errorText);

      // If derive fails, try creating new credentials via POST /auth/api-key
      const createRes = await fetch(`${CLOB_URL}/auth/api-key`, {
        method: "POST",
        headers: {
          POLY_ADDRESS: walletAddress,
          POLY_SIGNATURE: signature,
          POLY_TIMESTAMP: ts,
          POLY_NONCE: n,
        },
      });

      if (!createRes.ok) {
        const createErr = await createRes.text();
        return NextResponse.json(
          { error: `CLOB auth failed: ${createErr}` },
          { status: createRes.status }
        );
      }

      const creds = await createRes.json();
      await storeCLOBCredentials(
        userId,
        walletAddress,
        creds.apiKey,
        creds.secret,
        creds.passphrase
      );

      return NextResponse.json({ success: true });
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
