"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/layout/status-indicator";
import { useUiStore } from "@/stores/ui-store";

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

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
      <div className="min-w-0 flex-1">
        {breadcrumb ? (
          <div className="text-xs text-muted-foreground">{breadcrumb}</div>
        ) : null}
        {title ? (
          <h1 className="truncate text-sm font-medium text-foreground">
            {title}
          </h1>
        ) : null}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="hidden min-w-[220px] justify-between text-muted-foreground md:inline-flex"
        onClick={() => setCommandPaletteOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />
          Search or jump…
        </span>
        <kbd className="mono rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
          ⌘K
        </kbd>
      </Button>

      {actions}
      <StatusIndicator />
    </header>
  );
}
