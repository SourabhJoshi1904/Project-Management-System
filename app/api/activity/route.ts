import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";

// GET /api/activity
// Returns recent activity across every project the current user belongs
// to (used by the dashboard's "Activity Log" feed). Pass ?projectId=... to
// scope it to a single project instead.
export const GET = withErrorHandling(async (request: NextRequest): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const projectId = request.nextUrl.searchParams.get("projectId");

  const logs = await prisma.activityLog.findMany({
    where: {
      project: { members: { some: { userId: me.id } } },
      ...(projectId ? { projectId } : {}),
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return jsonOk(logs);
});
