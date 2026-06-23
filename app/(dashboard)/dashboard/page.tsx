"use client";

import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  CircleCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { TeamAvatarStack } from "@/components/shared/team-avatar-stack";
import { StatusPieChart } from "@/components/analytics/status-pie-chart";
import { useDataStore, getProjectStats } from "@/lib/store";
import { formatDate, getPriorityColor, isDeadlineNear, isOverdue, timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const { projects, tasks, members, activityLogs, getUserById } = useDataStore();

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todoTasks = tasks.filter((t) => t.status === "TODO").length;
  const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED").length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.deadline && isOverdue(t.deadline)
  ).length;
  const overallProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const statusData = [
    { name: "To Do", value: todoTasks, color: "#9ca3af" },
    { name: "In Progress", value: inProgressTasks, color: "#3b82f6" },
    { name: "Completed", value: completedTasks, color: "#22c55e" },
  ];

  const upcomingDeadlines = tasks
    .filter((t) => t.deadline && t.status !== "COMPLETED")
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const recentActivity = [...activityLogs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening across your projects.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
          iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
          href="/projects"
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          icon={CheckSquare}
          iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
          href="/tasks"
        />
        <StatCard
          label="Completed Tasks"
          value={completedTasks}
          icon={CircleCheck}
          iconClassName="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
          href="/tasks?status=COMPLETED"
        />
        <StatCard
          label="Pending Tasks"
          value={pendingTasks}
          icon={Clock}
          iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
          href="/tasks?pending=true"
        />
        <StatCard
          label="Overdue Tasks"
          value={overdueTasks}
          icon={AlertTriangle}
          iconClassName="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
          href="/tasks?overdue=true&sort=deadline"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-center">
            <div className="flex items-center gap-4">
              <Progress value={overallProgress} className="h-3 flex-1" />
              <span className="text-sm font-semibold w-28 text-right">{overallProgress}% Completed</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {completedTasks} of {totalTasks} tasks completed across {totalProjects} project
              {totalProjects !== 1 ? "s" : ""}.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Projects</CardTitle>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Create your first project to start tracking tasks."
              />
            ) : (
              recentProjects.map((project) => {
                const stats = getProjectStats(project.id, tasks, members);
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}/tasks`}
                    className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="break-words font-medium">{project.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                      </div>
                      <Badge variant={project.status === "COMPLETED" ? "success" : project.status === "ARCHIVED" ? "secondary" : "info"}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Progress value={stats.progress} className="h-2 flex-1" />
                      <span className="text-xs font-medium text-muted-foreground w-10 text-right">{stats.progress}%</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <TeamAvatarStack members={members.filter((m) => m.projectId === project.id)} max={3} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{stats.completed}/{stats.total} tasks</span>
                        {project.deadline && <span>Due {formatDate(project.deadline)}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Activity Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              recentActivity.map((activity) => {
                const user = getUserById(activity.userId);
                return (
                  <div key={activity.id} className="flex items-start gap-3 animate-slide-in">
                    <Avatar className="h-7 w-7 mt-0.5">
                      <AvatarFallback className="text-[10px]">
                        {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm leading-snug">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(activity.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          <Link href="/tasks?sort=deadline">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View all tasks <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingDeadlines.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nothing due soon" description="All your tasks are on track." />
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((task) => {
                const project = projects.find((p) => p.id === task.projectId);
                const overdue = task.deadline ? isOverdue(task.deadline) : false;
                const near = task.deadline ? isDeadlineNear(task.deadline) : false;
                return (
                  <div key={task.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`h-2 w-2 shrink-0 rounded-full ${overdue ? "bg-red-500" : near ? "bg-yellow-500" : "bg-blue-500"}`} />
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{project?.title}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={getPriorityColor(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                      <span className={`text-xs font-medium ${overdue ? "text-red-500" : "text-muted-foreground"}`}>
                        {task.deadline ? formatDate(task.deadline) : "No deadline"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
