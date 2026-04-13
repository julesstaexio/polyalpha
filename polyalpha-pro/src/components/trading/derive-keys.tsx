"use client";

import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useAuth } from "@/hooks/use-auth";
import { useTradingStore } from "@/store";
import { Key, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Derives CLOB API keys by requesting a wallet signature,
 * then sending it to the server which calls Polymarket's /auth/derive-api-key.
 * Required before placing any trades.
 */
export function DeriveKeys() {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { hasCLOBCredentials, setHasCLOBCredentials } = useTradingStore();

  const [status, setStatus] = useState<"idle" | "signing" | "deriving" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleDerive() {
    if (!user?.id || !address) return;

    setStatus("signing");
    setErrorMsg("");

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = Math.floor(Math.random() * 1_000_000);
      const message = `Sign this message to derive your Polymarket trading API key.\n\nAddress: ${address}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;

      const signature = await signMessageAsync({ message });

      setStatus("deriving");

      const res = await fetch("/api/trade/derive-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          walletAddress: address,
          signature,
          timestamp,
          nonce,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Derivation failed (${res.status})`);
      }

      setHasCLOBCredentials(true);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message.includes("User rejected")
            ? "Signature rejected"
            : err.message.split("\n")[0]
          : "Failed to derive keys"
      );
    }
  }

  if (!isConnected) return null;

  if (hasCLOBCredentials) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-pm-green/10 border border-pm-green/20 rounded-lg text-xs text-pm-green">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        Trading keys active
      </div>
    );
  }

  return (
    <div className="border border-border rounded-[11px] bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Key className="h-4 w-4 text-pm-blue" />
        Setup Trading
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Sign a message with your wallet to derive your Polymarket CLOB API keys.
        This is required before you can place trades.
      </p>

      {status === "error" && (
        <div className="flex items-center gap-2 text-xs text-pm-red bg-pm-red/10 p-2 rounded-lg">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <button
        onClick={handleDerive}
        disabled={status === "signing" || status === "deriving"}
        className="w-full h-10 rounded-[7px] text-sm font-semibold bg-pm-blue text-white hover:bg-pm-blue/90 transition-colors disabled:opacity-50"
      >
        {status === "signing" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Sign in wallet...
          </span>
        ) : status === "deriving" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Deriving keys...
          </span>
        ) : (
          "Derive Trading Keys"
        )}
      </button>
    </div>
  );
}
