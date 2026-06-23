"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDataStore } from "@/lib/store";
import { timeAgo } from "@/lib/utils";
import type { Comment, Task, TaskPriority, TaskStatus } from "@/types";

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]),
  assignedToId: z.string().optional(),
  deadline: z
    .string()
    .optional()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), { message: "Please enter a valid date" }),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

export function TaskDialog({ open, onOpenChange, projectId, task, defaultStatus }: TaskDialogProps) {
  const { addTask, updateTask, members, currentUserId, getMyRole, getTaskComments, addComment } = useDataStore();
  const isEdit = !!task;

  // Members can only update the status of tasks assigned to them (and
  // comment) — everything else on this form is locked down for them.
  // Admins/Managers always have full access.
  const myRole = getMyRole(projectId);
  const isAssignedToMe = !!task && task.assignedToId === currentUserId;
  const statusOnly = myRole === "MEMBER" && isAssignedToMe;

  const projectMembers = members
    .filter((m) => m.projectId === projectId)
    .map((m) => m.user)
    .filter((u): u is NonNullable<typeof u> => !!u);

  const [comments, setComments] = React.useState<Comment[]>([]);
  const [commentText, setCommentText] = React.useState("");
  const [postingComment, setPostingComment] = React.useState(false);
  const [loadingComments, setLoadingComments] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "TODO",
      assignedToId: "unassigned",
      deadline: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        description: task?.description ?? "",
        priority: task?.priority ?? "MEDIUM",
        status: task?.status ?? defaultStatus ?? "TODO",
        assignedToId: task?.assignedToId ?? "unassigned",
        deadline: task?.deadline ? new Date(task.deadline).toISOString().slice(0, 10) : "",
      });
      setCommentText("");
      if (task) {
        setLoadingComments(true);
        getTaskComments(task.id)
          .then(setComments)
          .catch(() => setComments([]))
          .finally(() => setLoadingComments(false));
      } else {
        setComments([]);
      }
    }
  }, [open, task, defaultStatus, reset, getTaskComments]);

  async function onSubmit(values: TaskFormValues) {
    const deadline = values.deadline ? new Date(values.deadline) : null;
    const assignedToId = values.assignedToId === "unassigned" ? null : values.assignedToId;

    try {
      if (isEdit && task) {
        if (statusOnly) {
          // The server enforces this too, but we also only send `status`
          // from a Member so there's nothing for it to reject.
          await updateTask(task.id, { status: values.status as TaskStatus });
        } else {
          await updateTask(task.id, {
            title: values.title,
            description: values.description,
            priority: values.priority as TaskPriority,
            status: values.status as TaskStatus,
            deadline,
            assignedToId,
          });
        }
        toast.success("Task updated");
      } else {
        await addTask({
          title: values.title,
          description: values.description ?? "",
          priority: values.priority as TaskPriority,
          deadline,
          projectId,
          assignedToId,
        });
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handleAddComment() {
    if (!task || !commentText.trim()) return;
    setPostingComment(true);
    try {
      const created = await addComment(task.id, commentText.trim());
      setComments((prev) => [...prev, created]);
      setCommentText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't post that comment.");
    } finally {
      setPostingComment(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "Create a new task"}</DialogTitle>
          <DialogDescription>
            {statusOnly
              ? "This task is assigned to you — you can update its status and leave a comment."
              : isEdit
              ? "Update the task details below."
              : "Fill in the details to add a task to this project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task title</Label>
            <Input id="title" placeholder="e.g. Create Login Page" disabled={statusOnly} {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more details about this task"
              rows={3}
              disabled={statusOnly}
              {...register("description")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={statusOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assigned to</Label>
              <Controller
                control={control}
                name="assignedToId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={statusOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {projectMembers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" disabled={statusOnly} {...register("deadline")} />
              {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
            </div>
          </div>

          {isEdit && task && (
            <div className="space-y-3 border-t border-border pt-4">
              <Label>Comments</Label>
              <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                {loadingComments ? (
                  <p className="text-xs text-muted-foreground">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No comments yet. Be the first to add one.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <Avatar className="h-6 w-6 mt-0.5">
                        <AvatarFallback className="text-[10px]">
                          {c.user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 rounded-md bg-muted/50 px-3 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium">{c.user?.name}</span>
                          <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-xs leading-snug">{c.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={!commentText.trim() || postingComment}
                  onClick={handleAddComment}
                  className="self-end"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
