"use client";

import { Menu, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/layout/status-indicator";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

export function Topbar({
  title,
  breadcrumb,
  actions,
}: {
  title?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-3 backdrop-blur md:px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation"
        aria-expanded={mobileNavOpen}
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="min-w-0 flex-1">
        {breadcrumb ? (
          <div className="truncate text-[11px] text-muted-foreground">
            {breadcrumb}
          </div>
        ) : null}
        {title ? (
          <div className="truncate text-sm font-medium text-foreground">
            {title}
          </div>
        ) : null}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="hidden min-w-[200px] justify-between text-muted-foreground lg:inline-flex"
        onClick={() => setCommandPaletteOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          Jump to…
        </span>
        <kbd className="mono rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
          ⌘K
        </kbd>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open command palette"
        onClick={() => setCommandPaletteOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      {actions}
      {user ? (
        <span className="hidden max-w-[140px] truncate text-[11px] text-muted-foreground sm:inline">
          {user.email}
        </span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        onClick={() => {
          logout();
          router.push("/");
        }}
      >
        <LogOut className="h-3.5 w-3.5" />
      </Button>
      <StatusIndicator />
    </header>
  );
}
