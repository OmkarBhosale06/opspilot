"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";

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
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} breadcrumb={breadcrumb} actions={actions} />
        <main className="min-h-0 flex-1 overflow-auto p-4">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
