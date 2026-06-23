import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, AuthError } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";
import { requireProjectRole, ADMIN_OR_MANAGER } from "@/lib/permissions";
import { logActivity, notify } from "@/lib/activity";
import { taskCreateSchema } from "@/lib/validations";

// GET /api/tasks
// Returns every task belonging to a project the current user is a member
// of. Pass ?projectId=... to scope to a single project (used by the Kanban
// board); otherwise returns everything for "My Tasks" / dashboard / global
// analytics. Filtering/sorting/pagination is done client-side since this
// app's dataset is small — the server's job here is just access control.
export const GET = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const projectId = request.nextUrl.searchParams.get("projectId");

  if (projectId) {
    await requireProjectRole(projectId, me.id, ["ADMIN", "MANAGER", "MEMBER"]);
  }

  const tasks = await prisma.task.findMany({
    where: {
      project: { members: { some: { userId: me.id } } },
      ...(projectId ? { projectId } : {}),
    },
    include: {
      assignedTo: true,
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk(tasks);
});

// POST /api/tasks
// Creates a task inside a project. Only ADMIN or MANAGER members of that
// project may create tasks (per spec: "Manager: Task Create / Assign / Edit").
export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const body = await request.json();
  const input = taskCreateSchema.parse(body);

  await requireProjectRole(input.projectId, me.id, ADMIN_OR_MANAGER);

  if (input.assignedToId) {
    const assigneeIsMember = await prisma.member.findUnique({
      where: { projectId_userId: { projectId: input.projectId, userId: input.assignedToId } },
    });
    if (!assigneeIsMember) {
      throw new AuthError("You can only assign tasks to members of this project.", 400);
    }
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description || null,
      priority: input.priority,
      status: input.status ?? "TODO",
      deadline: input.deadline ? new Date(input.deadline) : null,
      projectId: input.projectId,
      assignedToId: input.assignedToId || null,
    },
    include: { assignedTo: true, _count: { select: { comments: true } } },
  });

  await logActivity({
    userId: me.id,
    projectId: input.projectId,
    taskId: task.id,
    action: "TASK_CREATED",
    description: `${me.name} created task '${task.title}'`,
  });

  if (task.assignedToId && task.assignedToId !== me.id) {
    await notify({
      userId: task.assignedToId,
      title: "Task Assigned",
      message: `${me.name} assigned you '${task.title}'.`,
      type: "INFO",
    });
  }

  return jsonOk(task, 201);
});
