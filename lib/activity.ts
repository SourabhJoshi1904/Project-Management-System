import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/types";

export async function logActivity(params: {
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  action: string;
  description: string;
}) {
  return prisma.activityLog.create({
    data: {
      userId: params.userId,
      projectId: params.projectId ?? null,
      taskId: params.taskId ?? null,
      action: params.action,
      description: params.description,
    },
  });
}

export async function notify(params: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "INFO",
    },
  });
}
