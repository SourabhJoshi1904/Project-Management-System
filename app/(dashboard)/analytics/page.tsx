"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { SimpleLineChart } from "@/components/analytics/simple-line-chart";
import { SimpleBarChart } from "@/components/analytics/simple-bar-chart";
import { StatusPieChart } from "@/components/analytics/status-pie-chart";
import { useDataStore } from "@/lib/store";
import { isOverdue } from "@/lib/utils";
import { format } from "date-fns";
import { ListTodo, CircleCheck, AlertTriangle, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const { tasks, projects, members } = useDataStore();

  const totalTasksCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdueCount = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.deadline && isOverdue(t.deadline)
  ).length;
  const overallProgressPct = totalTasksCount === 0 ? 0 : Math.round((completedCount / totalTasksCount) * 100);

  // Tasks completed, month-wise (last 6 months based on updatedAt)
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM yyyy") });
  }
  const monthlyData = months.map(({ key, label }) => ({
    month: label,
    completed: tasks.filter(
      (t) => t.status === "COMPLETED" && format(new Date(t.updatedAt), "yyyy-MM") === key
    ).length,
  }));

  // Team performance across every project the current user belongs to.
  // Built from `members` (deduplicated by user) rather than a global user
  // directory, since that's the real "my teammates" set in a multi-tenant app.
  const teammates = Array.from(
    new Map(members.filter((m) => m.user).map((m) => [m.userId, m.user!])).values()
  );
  const teamData = teammates.map((u) => {
    const userTasks = tasks.filter((t) => t.assignedToId === u.id);
    return {
      name: u.name.split(" ")[0],
      completed: userTasks.filter((t) => t.status === "COMPLETED").length,
      inProgress: userTasks.filter((t) => t.status === "IN_PROGRESS").length,
      todo: userTasks.filter((t) => t.status === "TODO").length,
    };
  });

  // Project progress
  const progressData = projects.map((p) => {
    const projectTasks = tasks.filter((t) => t.projectId === p.id);
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === "COMPLETED").length;
    return {
      project: p.title.length > 16 ? p.title.slice(0, 16) + "…" : p.title,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
    };
  });

  // Overall status distribution
  const statusData = [
    { name: "To Do", value: tasks.filter((t) => t.status === "TODO").length, color: "#9ca3af" },
    { name: "In Progress", value: tasks.filter((t) => t.status === "IN_PROGRESS").length, color: "#3b82f6" },
    { name: "Completed", value: tasks.filter((t) => t.status === "COMPLETED").length, color: "#22c55e" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Insights across all {projects.length} project{projects.length !== 1 ? "s" : ""} and {members.length} memberships.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard
          label="Total Tasks"
          value={totalTasksCount}
          icon={ListTodo}
          iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
          href="/tasks"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          icon={CircleCheck}
          iconClassName="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
          href="/tasks?status=COMPLETED"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          iconClassName="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
          href="/tasks?overdue=true&sort=deadline"
        />
        <StatCard
          label="Overall Progress"
          value={`${overallProgressPct}%`}
          icon={TrendingUp}
          iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
          href="/tasks?status=COMPLETED"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasks Completed (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <SimpleLineChart
            data={monthlyData}
            xKey="month"
            lines={[{ key: "completed", color: "#22c55e", label: "Completed tasks" }]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Performance</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <SimpleBarChart
              data={teamData}
              xKey="name"
              bars={[
                { key: "completed", color: "#22c55e", label: "Completed" },
                { key: "inProgress", color: "#3b82f6", label: "In Progress" },
                { key: "todo", color: "#9ca3af", label: "To Do" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall Task Distribution</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <StatusPieChart data={statusData} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Progress (%)</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <SimpleBarChart
            data={progressData}
            xKey="project"
            bars={[{ key: "progress", color: "#6366f1", label: "Progress %" }]}
            layout="vertical"
            height={Math.max(220, progressData.length * 50)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
