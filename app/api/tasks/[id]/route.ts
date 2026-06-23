import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, AuthError } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";
import { getMemberRole, ADMIN_OR_MANAGER } from "@/lib/permissions";
import { logActivity, notify } from "@/lib/activity";
import { taskUpdateSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

async function loadTaskOrThrow(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new AuthError("Task not found.", 404);
  return task;
}

// GET /api/tasks/[id]
export const GET = withErrorHandling(async (_request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id } = await params;

  const task = await loadTaskOrThrow(id);
  const role = await getMemberRole(task.projectId, me.id);
  if (!role) throw new AuthError("Task not found.", 404);

  const full = await prisma.task.findUnique({
    where: { id },
    include: {
      project: true,
      assignedTo: true,
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      _count: { select: { comments: true } },
    },
  });

  return jsonOk(full);
});

// PUT /api/tasks/[id]
// ADMIN/MANAGER of the project can edit any field on any task.
// A plain MEMBER can ONLY change the `status` field, and only on tasks
// assigned to them (per spec: "Member: Update Assigned Tasks Only").
export const PUT = withErrorHandling(async (request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id } = await params;

  const task = await loadTaskOrThrow(id);
  const role = await getMemberRole(task.projectId, me.id);
  if (!role) throw new AuthError("Task not found.", 404);

  const body = await request.json();
  const input = taskUpdateSchema.parse(body);

  const isPrivileged = ADMIN_OR_MANAGER.includes(role);
  if (!isPrivileged) {
    const isAssignee = task.assignedToId === me.id;
    if (!isAssignee) {
      throw new AuthError("You can only update tasks assigned to you.", 403);
    }
    const triesToChangeOtherFields = Object.keys(input).some((key) => key !== "status");
    if (triesToChangeOtherFields) {
      throw new AuthError("Members can only update a task's status.", 403);
    }
  }

  if (input.assignedToId !== undefined && input.assignedToId) {
    const assigneeIsMember = await prisma.member.findUnique({
      where: { projectId_userId: { projectId: task.projectId, userId: input.assignedToId } },
    });
    if (!assigneeIsMember) {
      throw new AuthError("You can only assign tasks to members of this project.", 400);
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.deadline !== undefined ? { deadline: input.deadline ? new Date(input.deadline) : null } : {}),
      ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId || null } : {}),
    },
    include: { assignedTo: true, _count: { select: { comments: true } } },
  });

  if (input.status && input.status !== task.status) {
    const statusLabel = input.status === "TODO" ? "To Do" : input.status === "IN_PROGRESS" ? "In Progress" : "Completed";
    await logActivity({
      userId: me.id,
      projectId: task.projectId,
      taskId: id,
      action: input.status === "COMPLETED" ? "TASK_COMPLETED" : "TASK_UPDATED",
      description: `${me.name} moved '${updated.title}' to ${statusLabel}`,
    });
  }

  if (input.assignedToId && input.assignedToId !== task.assignedToId && input.assignedToId !== me.id) {
    await notify({
      userId: input.assignedToId,
      title: "Task Assigned",
      message: `${me.name} assigned you '${updated.title}'.`,
      type: "INFO",
    });
  }

  return jsonOk(updated);
});

// DELETE /api/tasks/[id]
// Only ADMIN/MANAGER of the project may delete tasks. MongoDB has no
// foreign keys, so we clean up the task's comments and activity log
// entries ourselves before removing the task.
export const DELETE = withErrorHandling(async (_request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id } = await params;

  const task = await loadTaskOrThrow(id);
  const role = await getMemberRole(task.projectId, me.id);
  if (!role) throw new AuthError("Task not found.", 404);
  if (!ADMIN_OR_MANAGER.includes(role)) {
    throw new AuthError("Only Admins and Managers can delete tasks.", 403);
  }

  await prisma.comment.deleteMany({ where: { taskId: id } });
  await prisma.activityLog.deleteMany({ where: { taskId: id } });
  await prisma.task.delete({ where: { id } });

  return jsonOk({ success: true });
});
