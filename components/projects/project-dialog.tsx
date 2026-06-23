"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { useDataStore } from "@/lib/store";
import type { Project } from "@/types";

const projectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(80, "Title is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  deadline: z
    .string()
    .optional()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), { message: "Please enter a valid date" }),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}

export function ProjectDialog({ open, onOpenChange, project }: ProjectDialogProps) {
  const { addProject, updateProject } = useDataStore();
  const isEdit = !!project;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        title: project?.title ?? "",
        description: project?.description ?? "",
        deadline: project?.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : "",
      });
    }
  }, [open, project, reset]);

  async function onSubmit(values: ProjectFormValues) {
    const deadline = values.deadline ? new Date(values.deadline) : null;
    try {
      if (isEdit && project) {
        await updateProject(project.id, { title: values.title, description: values.description, deadline });
        toast.success("Project updated");
      } else {
        await addProject({ title: values.title, description: values.description ?? "", deadline });
        toast.success("Project created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "Create a new project"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the project details below." : "Fill in the details to start a new project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Project name</Label>
            <Input id="title" placeholder="e.g. Weather App" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Real-time weather forecast system" rows={3} {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input id="deadline" type="date" {...register("deadline")} />
            {errors.deadline && <p className="text-xs text-destructive">{errors.deadline.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
