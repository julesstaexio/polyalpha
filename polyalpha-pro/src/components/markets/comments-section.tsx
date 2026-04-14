"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CommentsSection({
  conditionId,
  marketId,
  bare,
}: {
  conditionId: string;
  marketId: string;
  bare?: boolean;
}) {
  const { user, authenticated } = useAuth();
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["comments", conditionId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?conditionId=${conditionId}`);
      if (!res.ok) return { comments: [] };
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.google?.name || user?.wallet?.address?.slice(0, 8) || "Anon",
          marketId,
          conditionId,
          content,
        }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["comments", conditionId] });
    },
  });

  const comments: Comment[] = data?.comments ?? [];

  const content = (
    <div className="space-y-3">
      {/* Input */}
      {authenticated ? (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && text.trim()) mutation.mutate(text.trim());
            }}
            placeholder="Add a comment..."
            maxLength={500}
            className="flex-1 h-9 px-3 text-sm bg-secondary border-0 rounded-lg outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => text.trim() && mutation.mutate(text.trim())}
            disabled={!text.trim() || mutation.isPending}
            className="h-9 w-9 flex items-center justify-center bg-pm-blue rounded-lg text-white disabled:opacity-50 shrink-0"
          >
            {mutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Log in to comment
        </p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">
                  {c.user_name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {timeAgo(c.created_at)}
                </span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (bare) return content;

  return (
    <div className="border border-border rounded-[11px] bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-pm-blue" />
        <h3 className="text-sm font-semibold">
          Comments ({comments.length})
        </h3>
      </div>
      <div className="p-4">{content}</div>
    </div>
  );
}
