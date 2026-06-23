import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";

// GET /api/users
// Lists every user in the system. Used to populate "assign to" / "add
// member" dropdowns. Requires auth, but no project-level role check — every
// signed-in user is allowed to see the directory of other users.
export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  await requireCurrentUser();
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return jsonOk(users);
});
