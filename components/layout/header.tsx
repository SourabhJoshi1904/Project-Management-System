"use client";

import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useDataStore } from "@/lib/store";
import { cn, timeAgo } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";
import { Bell, Check, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

const typeDot: Record<string, string> = {
  INFO: "bg-blue-500",
  WARNING: "bg-yellow-500",
  SUCCESS: "bg-green-500",
  ERROR: "bg-red-500",
};

export function Header() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useDataStore();
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/tasks?search=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="flex min-w-0 items-center justify-between gap-2 border-b border-slate-800 bg-card px-3 py-3 sm:gap-4 sm:px-5 md:px-6">
      <form onSubmit={handleSearch} className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, projects..."
          className="pl-9"
        />
      </form>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[calc(100vw-1.5rem)] sm:w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet</p>
              )}
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={cn("flex flex-col items-start gap-0.5 whitespace-normal py-2", !n.read && "bg-accent/50")}
                >
                  <div className="flex w-full items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full flex-shrink-0", typeDot[n.type])} />
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.read && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="pl-4 text-xs text-muted-foreground">{n.message}</p>
                  <p className="pl-4 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </header>
  );
}
