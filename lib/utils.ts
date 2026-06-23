import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM dd, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM dd, yyyy HH:mm");
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isDeadlineNear(deadline: Date | string): boolean {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffInMs = deadlineDate.getTime() - now.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  return diffInDays <= 3 && diffInDays > 0;
}

export function isOverdue(deadline: Date | string): boolean {
  return new Date(deadline) < new Date();
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "text-red-500 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800";
    case "MEDIUM":
      return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800";
    case "LOW":
      return "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800";
    case "IN_PROGRESS":
      return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";
    case "TODO":
      return "text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getRoleColor(role: string): string {
  switch (role) {
    case "ADMIN":
      return "text-purple-600 bg-purple-50 border-purple-200";
    case "MANAGER":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "MEMBER":
      return "text-gray-600 bg-gray-50 border-gray-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function calculateProgress(tasks: { status: string }[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  return Math.round((completed / tasks.length) * 100);
}

export function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
