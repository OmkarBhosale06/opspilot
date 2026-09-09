"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { useUiStore } from "@/stores/ui-store";
import { useEffect } from "react";

export function AppShell({
  children,
  title,
  breadcrumb,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, setMobileNavOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/55 md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} breadcrumb={breadcrumb} actions={actions} />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-auto px-4 py-4 md:px-5 md:py-5"
        >
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
