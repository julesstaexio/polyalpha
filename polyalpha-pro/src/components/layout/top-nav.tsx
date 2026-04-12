"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useMarketStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Wallet, Bot, BarChart3, Menu, X, Activity, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useState } from "react";

const ConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((m) => m.ConnectButton),
  { ssr: false }
);

const CATEGORIES = [
  { href: "/", label: "Trending" },
  { href: "/markets?category=politics", label: "Politics" },
  { href: "/markets?category=crypto", label: "Crypto" },
  { href: "/markets?category=sports", label: "Sports" },
  { href: "/markets?category=tech", label: "Tech" },
  { href: "/markets?category=economics", label: "Finance" },
  { href: "/markets?category=entertainment", label: "Culture" },
];

export function TopNav() {
  const pathname = usePathname();
  const { authenticated, login, user } = useAuth();
  const { searchQuery, setSearchQuery } = useMarketStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Primary row: logo + search + auth */}
      <div className="flex items-center h-14 px-4 max-w-[1400px] mx-auto gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <img src="/logo.svg" alt="PolyAlpha" className="h-7 w-7" />
          <div className="hidden sm:flex items-baseline gap-px">
            <span className="text-[15px] font-semibold tracking-tight text-white">Poly</span>
            <span className="text-[15px] font-extralight tracking-tight text-[#a8c4ff]/90">alpha</span>
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-[480px] relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search markets"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-secondary border-0 text-sm rounded-lg placeholder:text-muted-foreground"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile search toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Quick links */}
          <Link
            href="/portfolio"
            className={cn(
              "hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
              pathname === "/portfolio"
                ? "text-foreground bg-secondary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden lg:inline">Portfolio</span>
          </Link>
          <Link
            href="/bots"
            className={cn(
              "hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
              pathname.startsWith("/bots")
                ? "text-foreground bg-secondary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bot className="h-4 w-4" />
            <span className="hidden lg:inline">Bots</span>
          </Link>
          <Link
            href="/signals"
            className={cn(
              "hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors",
              pathname === "/signals"
                ? "text-foreground bg-secondary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden lg:inline">Signals</span>
          </Link>

          {/* Auth */}
          {authenticated ? (
            <ConnectButton
              accountStatus="avatar"
              chainStatus="icon"
              showBalance={false}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={login}
                variant="ghost"
                size="sm"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Log In
              </Button>
              <Button
                onClick={login}
                size="sm"
                className="text-sm bg-foreground text-background hover:bg-foreground/90 rounded-lg h-9 px-4"
              >
                Sign Up
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="sm:hidden p-2 text-muted-foreground"
          >
            {showMobileMenu ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile search */}
      {showSearch && (
        <div className="px-4 pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-secondary border-0 text-sm rounded-lg"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Category pills row */}
      <div className="flex items-center gap-1 px-4 max-w-[1400px] mx-auto overflow-x-auto scrollbar-hide h-11">
        {CATEGORIES.map((cat) => {
          const isActive =
            cat.href === "/"
              ? pathname === "/"
              : pathname + (typeof window !== "undefined" ? window.location.search : "") === cat.href;
          return (
            <Link
              key={cat.href}
              href={cat.href}
              className={cn(
                "shrink-0 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {/* Mobile menu dropdown */}
      {showMobileMenu && (
        <div className="sm:hidden border-t border-border px-4 py-3 space-y-1 bg-background">
          <Link
            href="/portfolio"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-secondary"
            onClick={() => setShowMobileMenu(false)}
          >
            <Wallet className="h-4 w-4" />
            Portfolio
          </Link>
          <Link
            href="/bots"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-secondary"
            onClick={() => setShowMobileMenu(false)}
          >
            <Bot className="h-4 w-4" />
            Trading Bots
          </Link>
          <Link
            href="/signals"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-secondary"
            onClick={() => setShowMobileMenu(false)}
          >
            <BarChart3 className="h-4 w-4" />
            AI Signals
          </Link>
          <Link
            href="/activity"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-secondary"
            onClick={() => setShowMobileMenu(false)}
          >
            <Activity className="h-4 w-4" />
            Activity
          </Link>
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-secondary"
            onClick={() => setShowMobileMenu(false)}
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-secondary"
            onClick={() => setShowMobileMenu(false)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      )}
    </nav>
  );
}
