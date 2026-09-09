"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Box,
  GitBranch,
  Layers,
  Network,
  Radio,
  Settings,
  Shield,
  BookOpen,
  Workflow,
  AlertTriangle,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  stub?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV: NavGroup[] = [
  {
    label: "Command",
    items: [
      { href: "/overview", label: "Overview", icon: LayoutDashboard },
      { href: "/incidents", label: "Incidents", icon: AlertTriangle },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { href: "/infrastructure/pods", label: "Pods", icon: Box },
      {
        href: "/infrastructure/deployments",
        label: "Deployments",
        icon: Layers,
      },
      { href: "/infrastructure/events", label: "Events", icon: Radio },
      { href: "/infrastructure/graph", label: "Graph", icon: Network },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/deployments", label: "Deployments", icon: GitBranch },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        href: "/observability",
        label: "Observability",
        icon: Activity,
        stub: true,
      },
      {
        href: "/automation",
        label: "Automation",
        icon: Workflow,
        stub: true,
      },
      {
        href: "/knowledge",
        label: "Knowledge",
        icon: BookOpen,
        stub: true,
      },
      {
        href: "/settings",
        label: "Settings",
        icon: Settings,
        stub: true,
      },
    ],
  },
];

function NavLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const active =
    pathname === item.href ||
    (item.href !== "/overview" && pathname.startsWith(item.href));

  const content = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      <item.icon className="h-3.5 w-3.5 shrink-0" />
      {!collapsed && (
        <>
          <span className="truncate">{item.label}</span>
          {item.stub ? (
            <span className="ml-auto text-[9px] uppercase tracking-wide text-muted-foreground/70">
              Soon
            </span>
          ) : null}
        </>
      )}
    </Link>
  );

  if (!collapsed) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-card transition-[width] duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex h-12 items-center border-b border-border-subtle px-3",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ai/20 text-ai">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">
                OpsPilot
              </div>
              <div className="text-[10px] text-muted-foreground">
                SRE control plane
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-ai/20 text-ai">
            <Shield className="h-3.5 w-3.5" />
          </div>
        )}
        {!collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-2">
        {NAV.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </div>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {collapsed ? (
        <div className="border-t border-border-subtle p-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={toggleSidebar}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
    </aside>
  );
}
