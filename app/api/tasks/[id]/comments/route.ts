import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, AuthError } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";
import { getMemberRole } from "@/lib/permissions";
import { notify } from "@/lib/activity";
import { commentCreateSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/tasks/[id]/comments
export const GET = withErrorHandling(async (_request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id: taskId } = await params;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new AuthError("Task not found.", 404);
  const role = await getMemberRole(task.projectId, me.id);
  if (!role) throw new AuthError("Task not found.", 404);

  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return jsonOk(comments);
});

// POST /api/tasks/[id]/comments
// Any project member (ADMIN, MANAGER, or MEMBER) can comment on a task —
// per spec: "Member: ... Comment".
export const POST = withErrorHandling(async (request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id: taskId } = await params;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new AuthError("Task not found.", 404);
  const role = await getMemberRole(task.projectId, me.id);
  if (!role) throw new AuthError("Task not found.", 404);

  const body = await request.json();
  const input = commentCreateSchema.parse(body);

  const comment = await prisma.comment.create({
    data: { taskId, userId: me.id, message: input.message },
    include: { user: true },
  });

  if (task.assignedToId && task.assignedToId !== me.id) {
    await notify({
      userId: task.assignedToId,
      title: "New Comment",
      message: `${me.name} commented on '${task.title}'.`,
      type: "INFO",
    });
  }

  return jsonOk(comment, 201);
});
