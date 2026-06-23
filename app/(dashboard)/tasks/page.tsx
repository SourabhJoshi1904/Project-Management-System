"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { useDataStore } from "@/lib/store";
import { cn, formatDate, getPriorityColor, getStatusColor, isOverdue } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/types";

const PAGE_SIZE = 8;

function getTaskStatus(value: string | null): TaskStatus | "ALL" {
  return value === "TODO" || value === "IN_PROGRESS" || value === "COMPLETED" ? value : "ALL";
}

function getTaskPriority(value: string | null): TaskPriority | "ALL" {
  return value === "LOW" || value === "MEDIUM" || value === "HIGH" ? value : "ALL";
}

function getTaskScope(value: string | null): "all" | "mine" {
  return value === "mine" ? "mine" : "all";
}

function getTaskSort(value: string | null): "newest" | "oldest" | "deadline" {
  return value === "newest" || value === "oldest" || value === "deadline" ? value : "deadline";
}

export default function TasksPage() {
  const searchParams = useSearchParams();
  const { tasks, projects, currentUserId } = useDataStore();

  const [search, setSearch] = React.useState(searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = React.useState<TaskStatus | "ALL">(getTaskStatus(searchParams.get("status")));
  const [priorityFilter, setPriorityFilter] = React.useState<TaskPriority | "ALL">(getTaskPriority(searchParams.get("priority")));
  const [scope, setScope] = React.useState<"all" | "mine">(getTaskScope(searchParams.get("scope")));
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "deadline">(getTaskSort(searchParams.get("sort")));
  const [showPending, setShowPending] = React.useState(searchParams.get("pending") === "true");
  const [showOverdue, setShowOverdue] = React.useState(searchParams.get("overdue") === "true");
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
    setStatusFilter(getTaskStatus(searchParams.get("status")));
    setPriorityFilter(getTaskPriority(searchParams.get("priority")));
    setScope(getTaskScope(searchParams.get("scope")));
    setSortBy(getTaskSort(searchParams.get("sort")));
    setShowPending(searchParams.get("pending") === "true");
    setShowOverdue(searchParams.get("overdue") === "true");
  }, [searchParams]);

  const filtered = React.useMemo(() => {
    let list = [...tasks];
    if (scope === "mine") {
      list = list.filter((t) => t.assignedToId === currentUserId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "ALL") {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (showPending) {
      list = list.filter((t) => t.status !== "COMPLETED");
    }
    if (showOverdue) {
      list = list.filter((t) => t.status !== "COMPLETED" && !!t.deadline && isOverdue(t.deadline));
    }
    if (priorityFilter !== "ALL") {
      list = list.filter((t) => t.priority === priorityFilter);
    }
    list.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return ad - bd;
    });
    return list;
  }, [tasks, search, statusFilter, showPending, showOverdue, priorityFilter, sortBy, scope, currentUserId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, showPending, showOverdue, priorityFilter, sortBy, scope]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-sm text-muted-foreground">All tasks across your projects, in one place.</p>
      </div>

      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 sm:flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9"
          />
        </div>
        <Select value={scope} onValueChange={(v) => setScope(v as "all" | "mine")}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tasks</SelectItem>
            <SelectItem value="mine">Assigned to me</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "ALL")}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "ALL")}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Deadline</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
        {(showPending || showOverdue) && (
          <Button
            variant="outline"
            onClick={() => {
              setShowPending(false);
              setShowOverdue(false);
            }}
          >
            Clear quick filter
          </Button>
        )}
      </div>

      {paged.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="space-y-2">
          {paged.map((task) => {
            const project = projects.find((p) => p.id === task.projectId);
            const assignee = task.assignedTo;
            const overdue = task.deadline && task.status !== "COMPLETED" ? isOverdue(task.deadline) : false;
            return (
              <Link key={task.id} href={`/projects/${task.projectId}/tasks`}>
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{project?.title}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getStatusColor(task.status)} variant="outline">
                        {task.status.replace("_", " ")}
                      </Badge>
                      <Badge className={getPriorityColor(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                      {task.deadline && (
                        <span className={cn("text-xs", overdue ? "text-red-500 font-medium" : "text-muted-foreground")}>
                          {formatDate(task.deadline)}
                        </span>
                      )}
                      {assignee && (
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px]">
                            {assignee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              variant={page === i + 1 ? "default" : "outline"}
              size="icon"
              onClick={() => setPage(i + 1)}
              className="w-9"
            >
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="icon" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
