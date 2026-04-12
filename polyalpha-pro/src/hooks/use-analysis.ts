"use client";

import { useCallback, useRef } from "react";
import { useAnalysisStore } from "@/store";
import type { MarketAnalysis } from "@/types";

export function useAnalysis() {
  const {
    analyses,
    isAnalyzing,
    streamingText,
    setAnalysis,
    setIsAnalyzing,
    setStreamingText,
    appendStreamingText,
  } = useAnalysisStore();

  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(
    async (conditionId: string, userId?: string) => {
      // Cancel any in-flight analysis
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsAnalyzing(true);
      setStreamingText("");

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conditionId, userId }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Analysis failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "text") {
                appendStreamingText(parsed.data);
              } else if (parsed.type === "done") {
                setAnalysis(conditionId, parsed.data as MarketAnalysis);
              } else if (parsed.type === "quant") {
                // Quant signals arrive first — could update UI instantly
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Analysis error:", error);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [setIsAnalyzing, setStreamingText, appendStreamingText, setAnalysis]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsAnalyzing(false);
  }, [setIsAnalyzing]);

  return { analyses, isAnalyzing, streamingText, analyze, cancel };
}
