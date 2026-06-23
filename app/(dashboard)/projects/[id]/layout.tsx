"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Users, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ProjectDialog } from "@/components/projects/project-dialog";
import { TeamAvatarStack } from "@/components/shared/team-avatar-stack";
import { useDataStore, getProjectStats } from "@/lib/store";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const tabs = [
  { label: "Tasks", segment: "tasks" },
  { label: "Members", segment: "members" },
  { label: "Analytics", segment: "analytics" },
];

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { projects, tasks, members, deleteProject, getMyRole } = useDataStore();

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const project = projects.find((p) => p.id === params.id);
  const stats = project ? getProjectStats(project.id, tasks, members) : null;
  const myRole = project ? getMyRole(project.id) : null;
  const canEdit = myRole === "ADMIN" || myRole === "MANAGER";
  const canDelete = myRole === "ADMIN";

  if (!project || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-semibold">Project not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been deleted, or the link is incorrect.
        </p>
        <Link href="/projects" className="mt-4">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to projects
          </Button>
        </Link>
      </div>
    );
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteProject(project!.id);
      toast.success("Project deleted");
      router.push("/projects");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete this project.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to projects
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 break-words text-2xl font-bold tracking-tight">{project.title}</h1>
            <Badge
              variant={
                project.status === "COMPLETED"
                  ? "success"
                  : project.status === "ARCHIVED"
                  ? "secondary"
                  : "info"
              }
            >
              {project.status}
            </Badge>
          </div>
          <p className="max-w-2xl break-words text-sm text-muted-foreground">{project.description}</p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
            {project.deadline && (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" /> Due {formatDate(project.deadline)}
              </span>
            )}
            <span>
              {stats.completed}/{stats.total} tasks completed
            </span>
            {stats.overdue > 0 && (
              <Badge variant="danger" className="px-1.5 py-0">
                {stats.overdue} overdue
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Team
            </span>
            <TeamAvatarStack members={members.filter((m) => m.projectId === project.id)} max={6} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden min-w-[160px] flex-col gap-1 sm:flex">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium">{stats.progress}%</span>
            </div>
            <Progress value={stats.progress} className="h-2" />
          </div>
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4" /> Edit project
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Delete project
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => {
          const href = `/projects/${project.id}/${tab.segment}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>

      <ProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{project.title}&rdquo; and all of its tasks. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
