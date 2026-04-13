"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi";
import { useWalletBalance } from "@/hooks/use-wallet-balance";
import {
  USDC_ADDRESS,
  CTF_EXCHANGE,
  ERC20_ABI,
  CTF_EXCHANGE_ABI,
  POLYGON_CHAIN_ID,
  parseUSDC,
} from "@/lib/contracts";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";

type Tab = "deposit" | "withdraw";
type Step = "idle" | "switching" | "approving" | "depositing" | "withdrawing" | "done" | "error";

export function DepositWithdraw() {
  const [tab, setTab] = useState<Tab>("deposit");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { balance, allowance, isConnected, refetch } = useWalletBalance();
  const { chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const isPolygon = chain?.id === POLYGON_CHAIN_ID;

  const amountNum = parseFloat(amount) || 0;
  const needsApproval = tab === "deposit" && amountNum > allowance;

  // ─── Approve tx ───
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
    error: approveError,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  // ─── Deposit tx ───
  const {
    writeContract: writeDeposit,
    data: depositTxHash,
    isPending: isDepositPending,
    error: depositError,
  } = useWriteContract();

  const { isLoading: isDepositConfirming, isSuccess: isDepositConfirmed } =
    useWaitForTransactionReceipt({ hash: depositTxHash });

  // ─── Withdraw tx ───
  const {
    writeContract: writeWithdraw,
    data: withdrawTxHash,
    isPending: isWithdrawPending,
    error: withdrawError,
  } = useWriteContract();

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawConfirmed } =
    useWaitForTransactionReceipt({ hash: withdrawTxHash });

  // After approval confirms, auto-trigger deposit
  useEffect(() => {
    if (isApproveConfirmed && step === "approving") {
      doDeposit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApproveConfirmed]);

  // After deposit/withdraw confirms
  useEffect(() => {
    if (isDepositConfirmed || isWithdrawConfirmed) {
      setStep("done");
      refetch();
      setTimeout(() => {
        setStep("idle");
        setAmount("");
      }, 3000);
    }
  }, [isDepositConfirmed, isWithdrawConfirmed, refetch]);

  // Handle errors
  useEffect(() => {
    const err = approveError || depositError || withdrawError;
    if (err) {
      setStep("error");
      setErrorMsg(err.message?.split("\n")[0] || "Transaction failed");
    }
  }, [approveError, depositError, withdrawError]);

  async function ensurePolygon(): Promise<boolean> {
    if (isPolygon) return true;
    try {
      setStep("switching");
      await switchChainAsync({ chainId: POLYGON_CHAIN_ID });
      return true;
    } catch {
      setStep("error");
      setErrorMsg("Please switch to Polygon network");
      return false;
    }
  }

  function doDeposit() {
    setStep("depositing");
    writeDeposit({
      address: CTF_EXCHANGE,
      abi: CTF_EXCHANGE_ABI,
      functionName: "depositFunds",
      args: [parseUSDC(amount)],
      chainId: POLYGON_CHAIN_ID,
    });
  }

  async function handleDeposit() {
    if (amountNum <= 0 || amountNum > balance) return;
    setErrorMsg("");

    const onPolygon = await ensurePolygon();
    if (!onPolygon) return;

    if (needsApproval) {
      // Approve max to avoid repeated approvals
      setStep("approving");
      writeApprove({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CTF_EXCHANGE, parseUSDC("999999999")],
        chainId: POLYGON_CHAIN_ID,
      });
    } else {
      doDeposit();
    }
  }

  async function handleWithdraw() {
    if (amountNum <= 0) return;
    setErrorMsg("");

    const onPolygon = await ensurePolygon();
    if (!onPolygon) return;

    setStep("withdrawing");
    writeWithdraw({
      address: CTF_EXCHANGE,
      abi: CTF_EXCHANGE_ABI,
      functionName: "withdrawFunds",
      args: [parseUSDC(amount)],
      chainId: POLYGON_CHAIN_ID,
    });
  }

  const isBusy =
    isApprovePending ||
    isApproveConfirming ||
    isDepositPending ||
    isDepositConfirming ||
    isWithdrawPending ||
    isWithdrawConfirming ||
    step === "switching";

  const isDeposit = tab === "deposit";

  function statusText(): string {
    switch (step) {
      case "switching":
        return "Switching to Polygon...";
      case "approving":
        return isApproveConfirming ? "Confirming approval..." : "Approve USDC in wallet...";
      case "depositing":
        return isDepositConfirming ? "Confirming deposit..." : "Confirm deposit in wallet...";
      case "withdrawing":
        return isWithdrawConfirming ? "Confirming withdrawal..." : "Confirm withdrawal in wallet...";
      case "done":
        return isDeposit ? "Deposit successful!" : "Withdrawal successful!";
      case "error":
        return errorMsg;
      default:
        return "";
    }
  }

  return (
    <div className="border border-border rounded-[11px] bg-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Funds</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Tab toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => { setTab("deposit"); setStep("idle"); setErrorMsg(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[7px] text-sm font-semibold transition-colors ${
              isDeposit
                ? "bg-pm-green/15 text-pm-green"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Deposit
          </button>
          <button
            onClick={() => { setTab("withdraw"); setStep("idle"); setErrorMsg(""); }}
            className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-[7px] text-sm font-semibold transition-colors ${
              !isDeposit
                ? "bg-pm-red/15 text-pm-red"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpFromLine className="h-3.5 w-3.5" />
            Withdraw
          </button>
        </div>

        {/* Balance info */}
        <div className="bg-secondary/50 rounded-lg p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Wallet USDC</span>
            <span className="font-medium tabular-nums">${balance.toFixed(2)}</span>
          </div>
          {!isPolygon && isConnected && (
            <p className="text-pm-red text-[11px]">Switch to Polygon to deposit/withdraw</p>
          )}
        </div>

        {/* Amount input */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">
            Amount (USDC)
          </label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9 text-sm bg-secondary border-0 rounded-lg"
            disabled={isBusy}
          />
          <div className="flex gap-1.5">
            {[10, 25, 50, 100].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                disabled={isBusy}
                className="flex-1 h-7 text-[11px] font-medium bg-secondary hover:bg-[#2f3842] rounded-md transition-colors text-muted-foreground disabled:opacity-50"
              >
                ${v}
              </button>
            ))}
            {isDeposit && (
              <button
                onClick={() => setAmount(balance.toFixed(2))}
                disabled={isBusy}
                className="flex-1 h-7 text-[11px] font-medium bg-secondary hover:bg-[#2f3842] rounded-md transition-colors text-muted-foreground disabled:opacity-50"
              >
                Max
              </button>
            )}
          </div>
        </div>

        {/* Status message */}
        {step !== "idle" && (
          <div
            className={`flex items-center gap-2 text-xs p-2.5 rounded-lg ${
              step === "done"
                ? "bg-pm-green/10 text-pm-green"
                : step === "error"
                ? "bg-pm-red/10 text-pm-red"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {step === "done" ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : step === "error" ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            )}
            <span className="truncate">{statusText()}</span>
          </div>
        )}

        {/* Action button */}
        {isConnected ? (
          <button
            onClick={isDeposit ? handleDeposit : handleWithdraw}
            disabled={isBusy || amountNum <= 0 || (isDeposit && amountNum > balance)}
            className={`w-full h-11 rounded-[7px] text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDeposit
                ? "bg-pm-green text-white hover:bg-pm-green/90"
                : "bg-pm-red text-white hover:bg-pm-red/90"
            }`}
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : isDeposit ? (
              needsApproval ? `Approve & Deposit $${amountNum.toFixed(2)}` : `Deposit $${amountNum.toFixed(2)}`
            ) : (
              `Withdraw $${amountNum.toFixed(2)}`
            )}
          </button>
        ) : (
          <p className="text-xs text-center text-muted-foreground py-2">
            Connect your wallet to deposit or withdraw
          </p>
        )}
      </div>
    </div>
  );
}
