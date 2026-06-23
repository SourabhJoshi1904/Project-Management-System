import { prisma } from "@/lib/prisma";
import { AuthError } from "@/lib/auth";
import type { MemberRole } from "@/types";

/**
 * Looks up the caller's membership role on a given project.
 * Returns null when the user is not a member of the project at all.
 */
export async function getMemberRole(projectId: string, userId: string): Promise<MemberRole | null> {
  const member = await prisma.member.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return member?.role ?? null;
}

/**
 * Throws a 403 AuthError unless the caller's role is one of `allowed`.
 * Throws a 404-flavoured AuthError if the caller isn't a member at all,
 * so we don't leak the existence of projects the user has no access to.
 */
export async function requireProjectRole(
  projectId: string,
  userId: string,
  allowed: MemberRole[]
): Promise<MemberRole> {
  const role = await getMemberRole(projectId, userId);
  if (!role) {
    throw new AuthError("Project not found.", 404);
  }
  if (!allowed.includes(role)) {
    throw new AuthError(
      `Forbidden: this action requires one of [${allowed.join(", ")}], you have ${role}.`,
      403
    );
  }
  return role;
}

/** ADMIN can do everything: manage the project, members, and all tasks. */
export const ADMIN_ONLY: MemberRole[] = ["ADMIN"];
/** ADMIN + MANAGER can create/edit/delete tasks and update project details. */
export const ADMIN_OR_MANAGER: MemberRole[] = ["ADMIN", "MANAGER"];
/** Any project member at all (ADMIN, MANAGER, or MEMBER). */
export const ANY_MEMBER: MemberRole[] = ["ADMIN", "MANAGER", "MEMBER"];
