import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";

// GET /api/notifications
// Returns the current user's own notifications (never anyone else's),
// newest first. Used by the bell icon dropdown in the header.
export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  const me = await requireCurrentUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return jsonOk(notifications);
});
