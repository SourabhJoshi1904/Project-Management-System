"use client";

import * as React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { CalendarClock, MessageSquare, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn, formatDate, getPriorityColor, isOverdue } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  index: number;
  commentCount: number;
  canEdit: boolean;
  canDelete: boolean;
  canDrag: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, index, commentCount, canEdit, canDelete, canDrag, onEdit, onDelete }: TaskCardProps) {
  const assignee = task.assignedTo;
  const overdue = task.deadline && task.status !== "COMPLETED" ? isOverdue(task.deadline) : false;

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={!canDrag}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style as React.CSSProperties}
          className={cn(
            "group min-w-0 rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary/40"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 break-words text-sm font-medium leading-snug">{task.title}</p>
            {(canEdit || canDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(task)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {task.description && (
            <p className="mt-1 break-words text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Badge className={getPriorityColor(task.priority)} variant="outline">
              {task.priority}
            </Badge>
            {assignee ? (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {assignee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="text-[11px] text-muted-foreground">Unassigned</span>
            )}
          </div>

          {(task.deadline || commentCount > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              {task.deadline && (
                <span className={cn("flex items-center gap-1", overdue && "text-red-500 font-medium")}>
                  <CalendarClock className="h-3 w-3" /> {formatDate(task.deadline)}
                </span>
              )}
              {commentCount > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {commentCount}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
