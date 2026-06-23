import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, AuthError } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";
import { requireProjectRole, ADMIN_ONLY, ADMIN_OR_MANAGER } from "@/lib/permissions";
import { logActivity, notify } from "@/lib/activity";
import { projectUpdateSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/projects/[id]
// Returns a single project (with members + tasks) — only if the caller is
// a member of it. Non-members get a 404 (not a 403) so we don't leak which
// project ids exist.
export const GET = withErrorHandling(async (_request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id } = await params;

  await requireProjectRole(id, me.id, ["ADMIN", "MANAGER", "MEMBER"]);

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: true,
      members: { include: { user: true }, orderBy: { createdAt: "asc" } },
      tasks: { include: { assignedTo: true, _count: { select: { comments: true } } } },
    },
  });
  if (!project) throw new AuthError("Project not found.", 404);

  return jsonOk(project);
});

// PUT /api/projects/[id]
// Updates project fields. Only ADMIN or MANAGER members may do this.
export const PUT = withErrorHandling(async (request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id } = await params;

  await requireProjectRole(id, me.id, ADMIN_OR_MANAGER);

  const body = await request.json();
  const input = projectUpdateSchema.parse(body);

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.deadline !== undefined ? { deadline: input.deadline ? new Date(input.deadline) : null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    },
    include: {
      members: { include: { user: true } },
      _count: { select: { tasks: true, members: true } },
    },
  });

  await logActivity({
    userId: me.id,
    projectId: id,
    action: "PROJECT_UPDATED",
    description: `${me.name} updated the project`,
  });

  // Let teammates know the project changed (skip notifying the editor themself)
  const others = updated.members.filter((m: { userId: string }) => m.userId !== me.id);
  await Promise.all(
    others.map((m: { userId: string }) =>
      notify({
        userId: m.userId,
        title: "Project Updated",
        message: `${me.name} updated '${updated.title}'.`,
        type: "SUCCESS",
      })
    )
  );

  return jsonOk(updated);
});

// DELETE /api/projects/[id]
// Only ADMIN members (which always includes the owner) may delete a
// project. MongoDB has no foreign keys, so unlike a SQL database there's no
// automatic ON DELETE CASCADE — we delete the project's dependent records
// ourselves, in dependency order (comments -> activity logs -> tasks ->
// members -> the project itself).
export const DELETE = withErrorHandling(async (_request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id } = await params;

  await requireProjectRole(id, me.id, ADMIN_ONLY);

  const projectTasks = await prisma.task.findMany({ where: { projectId: id }, select: { id: true } });
  const taskIds = projectTasks.map((t: { id: string }) => t.id);

  if (taskIds.length > 0) {
    await prisma.comment.deleteMany({ where: { taskId: { in: taskIds } } });
  }
  await prisma.activityLog.deleteMany({ where: { projectId: id } });
  await prisma.task.deleteMany({ where: { projectId: id } });
  await prisma.member.deleteMany({ where: { projectId: id } });
  await prisma.project.delete({ where: { id } });

  return jsonOk({ success: true });
});
