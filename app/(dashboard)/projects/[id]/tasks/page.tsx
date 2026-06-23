"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useDataStore } from "@/lib/store";
import type { TaskPriority } from "@/types";

export default function ProjectTasksPage() {
  const params = useParams<{ id: string }>();
  const { tasks, getMyRole } = useDataStore();
  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState<TaskPriority | "ALL">("ALL");
  const [createOpen, setCreateOpen] = React.useState(false);

  const projectId = params.id;
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const myRole = getMyRole(projectId);
  const canCreateTasks = myRole === "ADMIN" || myRole === "MANAGER";

  // Search/filter informs the user which tasks match, while the board itself
  // keeps full drag-and-drop columns (filtering a kanban would break DnD indices).
  const matchCount = projectTasks.filter((t) => {
    const matchesSearch = !search.trim() || t.title.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  }).length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 sm:flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks on this board..."
            className="pl-9"
          />
        </div>
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
        {(search.trim() || priorityFilter !== "ALL") && (
          <span className="text-xs text-muted-foreground">{matchCount} match(es)</span>
        )}
        {canCreateTasks && (
          <Button className="gap-2 sm:ml-auto" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add task
          </Button>
        )}
      </div>

      <KanbanBoard projectId={projectId} />

      {canCreateTasks && <TaskDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />}
    </div>
  );
}
