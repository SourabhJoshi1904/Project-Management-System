import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";

// PUT /api/notifications/read-all
// Marks every unread notification belonging to the current user as read.
export const PUT = withErrorHandling(async (): Promise<NextResponse> => {
  const me = await requireCurrentUser();

  await prisma.notification.updateMany({
    where: { userId: me.id, read: false },
    data: { read: true },
  });

  return jsonOk({ success: true });
});
