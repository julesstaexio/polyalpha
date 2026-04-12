"use client";

import { Button } from "@/components/ui/button";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMarketStore } from "@/store";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileSidebar } from "./mobile-sidebar";
import { useAuth } from "@/hooks/use-auth";
import dynamic from "next/dynamic";

const ConnectButton = dynamic(
  () => import("@rainbow-me/rainbowkit").then((m) => m.ConnectButton),
  { ssr: false }
);

export function Header() {
  const { authenticated, login, logout, user } = useAuth();
  const { searchQuery, setSearchQuery } = useMarketStore();

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 gap-4">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger>
          <span className="md:hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 w-10 hover:bg-accent hover:text-accent-foreground">
            <Menu className="h-5 w-5" />
          </span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <MobileSidebar />
        </SheetContent>
      </Sheet>

      {/* Search */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search markets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background/50 border-border/50 h-9"
        />
      </div>

      {/* Auth / Wallet */}
      <div className="flex items-center gap-3">
        {authenticated ? (
          <>
            <ConnectButton
              accountStatus="avatar"
              chainStatus="icon"
              showBalance={false}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-muted-foreground text-xs"
            >
              {user?.google?.name || user?.wallet?.address?.slice(0, 6) + "..."}
            </Button>
          </>
        ) : (
          <Button onClick={login} className="bg-violet-600 hover:bg-violet-700">
            Connect
          </Button>
        )}
      </div>
    </header>
  );
}
