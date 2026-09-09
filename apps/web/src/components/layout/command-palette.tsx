"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Activity,
  AlertTriangle,
  Box,
  BookOpen,
  GitBranch,
  LayoutDashboard,
  Layers,
  Network,
  Radio,
  Settings,
  Workflow,
} from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const PAGES = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard, group: "Navigate" },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle, group: "Navigate" },
  { href: "/incidents/INC-1042", label: "INC-1042 Command Center", icon: AlertTriangle, group: "Incidents" },
  { href: "/infrastructure/pods", label: "Pods", icon: Box, group: "Infrastructure" },
  { href: "/infrastructure/deployments", label: "Infra Deployments", icon: Layers, group: "Infrastructure" },
  { href: "/infrastructure/events", label: "Events", icon: Radio, group: "Infrastructure" },
  { href: "/infrastructure/graph", label: "Infrastructure Graph", icon: Network, group: "Infrastructure" },
  { href: "/deployments", label: "Deployment Timeline", icon: GitBranch, group: "Delivery" },
  { href: "/observability", label: "Observability", icon: Activity, group: "Platform" },
  { href: "/automation", label: "Automation", icon: Workflow, group: "Platform" },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen, group: "Platform" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Platform" },
];

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof PAGES>();
    for (const page of PAGES) {
      const list = map.get(page.group) ?? [];
      list.push(page);
      map.set(page.group, list);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command className="bg-card text-foreground" shouldFilter>
          <div className="border-b border-border px-3">
            <Command.Input
              placeholder="Jump to page, search incidents…"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-2 py-6 text-center text-xs text-muted-foreground">
              No matches. Incident search placeholder — connect memory later.
            </Command.Empty>
            {groups.map(([group, items]) => (
              <Command.Group
                key={group}
                heading={group}
                className="mb-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {items.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={`${item.label} ${item.href}`}
                    onSelect={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-xs data-[selected=true]:bg-accent"
                  >
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{item.label}</span>
                    <span className="mono ml-auto text-[10px] text-muted-foreground">
                      {item.href}
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
