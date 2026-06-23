import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";
import { projectCreateSchema } from "@/lib/validations";

// GET /api/projects
// Returns every project the current user belongs to (as owner, admin,
// manager, or member), with embedded members+user and task/member counts.
export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  const me = await requireCurrentUser();

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: me.id } } },
    include: {
      members: { include: { user: true }, orderBy: { createdAt: "asc" } },
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk(projects);
});

// POST /api/projects
// Creates a project owned by the current user. The owner is automatically
// added as an ADMIN member so they immediately have full permissions.
export const POST = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const body = await request.json();
  const input = projectCreateSchema.parse(body);

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        title: input.title,
        description: input.description || null,
        deadline: input.deadline ? new Date(input.deadline) : null,
        ownerId: me.id,
      },
    });
    await tx.member.create({
      data: { projectId: created.id, userId: me.id, role: "ADMIN" },
    });
    return created;
  });

  await logActivity({
    userId: me.id,
    projectId: project.id,
    action: "PROJECT_CREATED",
    description: `${me.name} created project '${project.title}'`,
  });

  const withRelations = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      members: { include: { user: true } },
      _count: { select: { tasks: true, members: true } },
    },
  });

  return jsonOk(withRelations, 201);
});
