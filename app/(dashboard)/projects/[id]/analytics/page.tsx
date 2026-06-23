"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { CheckSquare, Clock, ListTodo, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusPieChart } from "@/components/analytics/status-pie-chart";
import { SimpleBarChart } from "@/components/analytics/simple-bar-chart";
import { useDataStore } from "@/lib/store";
import { isOverdue } from "@/lib/utils";

export default function ProjectAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const { tasks, members } = useDataStore();

  const projectId = params.id;
  const projectTasks = tasks.filter((t) => t.projectId === projectId);
  const projectMembers = members.filter((m) => m.projectId === projectId);

  const total = projectTasks.length;
  const completed = projectTasks.filter((t) => t.status === "COMPLETED").length;
  const inProgress = projectTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todo = projectTasks.filter((t) => t.status === "TODO").length;
  const overdue = projectTasks.filter(
    (t) => t.status !== "COMPLETED" && t.deadline && isOverdue(t.deadline)
  ).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  const statusData = [
    { name: "To Do", value: todo, color: "#9ca3af" },
    { name: "In Progress", value: inProgress, color: "#3b82f6" },
    { name: "Completed", value: completed, color: "#22c55e" },
  ];

  const priorityData = ["LOW", "MEDIUM", "HIGH"].map((priority) => ({
    priority: priority.charAt(0) + priority.slice(1).toLowerCase(),
    count: projectTasks.filter((t) => t.priority === priority).length,
  }));

  const memberData = projectMembers.map((m) => {
    const user = m.user;
    const userTasks = projectTasks.filter((t) => t.assignedToId === m.userId);
    return {
      name: user?.name.split(" ")[0] ?? "Unknown",
      completed: userTasks.filter((t) => t.status === "COMPLETED").length,
      pending: userTasks.filter((t) => t.status !== "COMPLETED").length,
    };
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Tasks" value={total} icon={ListTodo} iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" />
        <StatCard label="Completed" value={completed} icon={CheckSquare} iconClassName="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" />
        <StatCard label="In Progress" value={inProgress} icon={Clock} iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} iconClassName="bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400" />
        <StatCard label="Progress" value={`${progress}%`} icon={TrendingUp} iconClassName="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart data={statusData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={priorityData}
              xKey="priority"
              bars={[{ key: "count", color: "#6366f1", label: "Tasks" }]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleBarChart
            data={memberData}
            xKey="name"
            bars={[
              { key: "completed", color: "#22c55e", label: "Completed" },
              { key: "pending", color: "#f59e0b", label: "Pending" },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
