"use client";

import { cn } from "@/lib/utils";
import {
    BarChart3,
    CheckSquare,
    FolderKanban,
    LayoutDashboard,
    Settings,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "My Tasks",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  // Start collapsed; will expand on hover
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-slate-800 bg-card md:relative md:inset-auto md:h-full md:flex-col md:border-r md:border-t-0 md:transition-all md:duration-150",
          collapsed ? "md:w-16" : "md:w-64"
        )}
    >
      {/* Header / logo area */}
      <div className="hidden items-center gap-3 border-b border-border px-4 py-3 md:flex">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="font-bold text-lg text-foreground text-[1.08em]">TaskFlow</span>}
      </div>

      {/* Navigation */}
      <nav className="grid flex-1 grid-cols-5 gap-1 p-2 md:block md:space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] transition-colors duration-150 md:h-auto md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-sm",
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                  collapsed && "md:justify-center"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="max-w-full truncate font-medium md:hidden">{item.label}</span>
                {!collapsed && <span className="hidden text-sm font-medium md:inline">{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="hidden flex-shrink-0 p-3 pb-[2%] md:block">
        {/* reserved for bottom actions (avatar, settings) */}
      </div>
    </div>
  );
}
