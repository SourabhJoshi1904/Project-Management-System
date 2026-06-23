import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, AuthError } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";
import { requireProjectRole, ADMIN_ONLY } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { memberUpdateSchema } from "@/lib/validations";

type RouteParams = { params: Promise<{ id: string; memberId: string }> };

async function loadMember(projectId: string, memberId: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { user: true },
  });
  if (!member || member.projectId !== projectId) {
    throw new AuthError("Member not found.", 404);
  }
  return member;
}

// PUT /api/projects/[id]/members/[memberId]
// Changes a member's role. ADMIN only. The project owner's role can't be
// changed away from ADMIN — they always need full control of their project.
export const PUT = withErrorHandling(async (request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id: projectId, memberId } = await params;

  await requireProjectRole(projectId, me.id, ADMIN_ONLY);

  const body = await request.json();
  const input = memberUpdateSchema.parse(body);

  const member = await loadMember(projectId, memberId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (project?.ownerId === member.userId && input.role !== "ADMIN") {
    throw new AuthError("The project owner must stay an Admin.", 400);
  }

  const updated = await prisma.member.update({
    where: { id: memberId },
    data: { role: input.role },
    include: { user: true },
  });

  await logActivity({
    userId: me.id,
    projectId,
    action: "MEMBER_ROLE_UPDATED",
    description: `${me.name} changed ${updated.user.name}'s role to ${input.role}`,
  });

  return jsonOk(updated);
});

// DELETE /api/projects/[id]/members/[memberId]
// Removes a teammate from the project. ADMIN only. The owner can't be
// removed from their own project.
export const DELETE = withErrorHandling(async (_request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id: projectId, memberId } = await params;

  await requireProjectRole(projectId, me.id, ADMIN_ONLY);

  const member = await loadMember(projectId, memberId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (project?.ownerId === member.userId) {
    throw new AuthError("The project owner can't be removed from their own project.", 400);
  }

  await prisma.member.delete({ where: { id: memberId } });

  await logActivity({
    userId: me.id,
    projectId,
    action: "MEMBER_REMOVED",
    description: `${me.name} removed ${member.user.name} from the project`,
  });

  return jsonOk({ success: true });
});
