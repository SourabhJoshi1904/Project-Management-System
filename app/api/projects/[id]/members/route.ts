import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, AuthError } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";
import { requireProjectRole, ADMIN_ONLY, ANY_MEMBER } from "@/lib/permissions";
import { logActivity, notify } from "@/lib/activity";
import { memberAddSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/members
export const GET = withErrorHandling(async (_request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id: projectId } = await params;

  await requireProjectRole(projectId, me.id, ANY_MEMBER);

  const members = await prisma.member.findMany({
    where: { projectId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return jsonOk(members);
});

// POST /api/projects/[id]/members
// Adds a teammate to the project. Only ADMIN members can manage the team
// (per spec: "Admin: User Manage / Everything"). Accepts either an existing
// `userId` (picked from the directory) or an `email` address (typed by the
// admin) — whichever the client sent, validated by memberAddSchema.
export const POST = withErrorHandling(async (request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id: projectId } = await params;

  await requireProjectRole(projectId, me.id, ADMIN_ONLY);

  const body = await request.json();
  const input = memberAddSchema.parse(body);

  const targetUser = input.userId
    ? await prisma.user.findUnique({ where: { id: input.userId } })
    : await prisma.user.findUnique({ where: { email: input.email!.toLowerCase() } });

  if (!targetUser) {
    throw new AuthError(
      input.userId
        ? "That user does not exist."
        : `No TaskFlow account found for ${input.email}. Ask them to sign up first, then add them.`,
      404
    );
  }

  const existing = await prisma.member.findUnique({
    where: { projectId_userId: { projectId, userId: targetUser.id } },
  });
  if (existing) throw new AuthError("That person is already a member of this project.", 400);

  const member = await prisma.member.create({
    data: { projectId, userId: targetUser.id, role: input.role },
    include: { user: true },
  });

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  await logActivity({
    userId: me.id,
    projectId,
    action: "MEMBER_ADDED",
    description: `${me.name} added ${targetUser.name} to the project`,
  });

  await notify({
    userId: targetUser.id,
    title: "Added to Project",
    message: `${me.name} added you to '${project?.title ?? "a project"}' as ${input.role}.`,
    type: "INFO",
  });

  return jsonOk(member, 201);
});
