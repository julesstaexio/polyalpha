"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Settings, Bell, Send, Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, authenticated } = useAuth();
  const [telegramChatId, setTelegramChatId] = useState("");
  const [notifyTrades, setNotifyTrades] = useState(true);
  const [notifyBots, setNotifyBots] = useState(true);
  const [notifyAlerts, setNotifyAlerts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Save to user_preferences table
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          telegramChatId,
          notifyTrades,
          notifyBots,
          notifyAlerts,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings className="h-5 w-5 text-pm-blue" />
          Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure notifications and preferences
        </p>
      </div>

      {!authenticated ? (
        <div className="border border-border rounded-[11px] bg-card py-12 text-center text-muted-foreground text-sm">
          Log in to access settings.
        </div>
      ) : (
        <>
          {/* Telegram Notifications */}
          <div className="border border-border rounded-[11px] bg-card">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Send className="h-4 w-4 text-pm-blue" />
              <h3 className="text-sm font-semibold">Telegram Notifications</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Get real-time alerts via Telegram. Message{" "}
                <span className="text-foreground font-medium">@PolyAlphaBot</span>{" "}
                on Telegram to get your Chat ID.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Telegram Chat ID
                </label>
                <Input
                  placeholder="e.g., 123456789"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="h-9 bg-secondary border-0 rounded-lg"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">Trade confirmations</span>
                  </div>
                  <button
                    onClick={() => setNotifyTrades(!notifyTrades)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      notifyTrades ? "bg-pm-green" : "bg-secondary"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        notifyTrades ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">Bot activity alerts</span>
                  </div>
                  <button
                    onClick={() => setNotifyBots(!notifyBots)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      notifyBots ? "bg-pm-green" : "bg-secondary"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        notifyBots ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">Price alerts</span>
                  </div>
                  <button
                    onClick={() => setNotifyAlerts(!notifyAlerts)}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      notifyAlerts ? "bg-pm-green" : "bg-secondary"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        notifyAlerts ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-11 rounded-[7px] text-sm font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              "Saved!"
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
