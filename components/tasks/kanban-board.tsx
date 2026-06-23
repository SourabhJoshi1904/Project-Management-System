"use client";

import * as React from "react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDataStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Task, TaskStatus } from "@/types";

const columns: { id: TaskStatus; title: string; dot: string }[] = [
  { id: "TODO", title: "To Do", dot: "bg-gray-400" },
  { id: "IN_PROGRESS", title: "In Progress", dot: "bg-blue-500" },
  { id: "COMPLETED", title: "Completed", dot: "bg-green-500" },
];

export function KanbanBoard({ projectId }: { projectId: string }) {
  const { tasks, currentUserId, getMyRole, moveTask, deleteTask } = useDataStore();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = React.useState<TaskStatus>("TODO");
  const [deleteTarget, setDeleteTarget] = React.useState<Task | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  // Per spec: Admins/Managers can create, fully edit, assign, and delete
  // any task. Members can only update the status of tasks assigned to
  // them (drag-and-drop or the status field) and comment — they can't
  // create tasks, edit other fields, or delete anything.
  const myRole = getMyRole(projectId);
  const canCreateOrDelete = myRole === "ADMIN" || myRole === "MANAGER";

  function canEditTask(task: Task) {
    return canCreateOrDelete || (myRole === "MEMBER" && task.assignedToId === currentUserId);
  }
  function canDragTask(task: Task) {
    return canEditTask(task);
  }

  function onDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    moveTask(draggableId, destination.droppableId as TaskStatus);
  }

  function handleAddTask(status: TaskStatus) {
    setEditingTask(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTask(deleteTarget.id);
      toast.success("Task deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete that task.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-w-0">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          {columns.map((col) => {
            const colTasks = projectTasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="min-w-0 rounded-lg bg-muted/40 p-3 md:flex md:flex-col">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                    <h3 className="text-sm font-semibold">{col.title}</h3>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {colTasks.length}
                    </span>
                  </div>
                  {canCreateOrDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleAddTask(col.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex min-h-[120px] flex-1 flex-col gap-2 rounded-md p-1 transition-colors",
                        snapshot.isDraggingOver && "bg-primary/5"
                      )}
                    >
                      {colTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          commentCount={task._count?.comments ?? 0}
                          canEdit={canEditTask(task)}
                          canDelete={canCreateOrDelete}
                          canDrag={canDragTask(task)}
                          onEdit={handleEditTask}
                          onDelete={setDeleteTarget}
                        />
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && canCreateOrDelete && (
                        <button
                          onClick={() => handleAddTask(col.id)}
                          className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border py-6 text-xs text-muted-foreground hover:bg-accent/40"
                        >
                          Drop tasks here or click to add
                        </button>
                      )}
                      {colTasks.length === 0 && !canCreateOrDelete && (
                        <div className="flex flex-1 items-center justify-center py-6 text-xs text-muted-foreground">
                          No tasks here
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        task={editingTask}
        defaultStatus={defaultStatus}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{deleteTarget?.title}&rdquo;. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
