import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, AuthError } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/notifications/[id]
// Marks a single notification as read. A user can only ever touch their
// own notifications — trying to mark someone else's as read returns 404
// (not 403) so we don't confirm whether that notification id even exists.
export const PUT = withErrorHandling(async (_request: NextRequest, { params }: RouteParams): Promise<NextResponse> => {
  const me = await requireCurrentUser();
  const { id } = await params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== me.id) {
    throw new AuthError("Notification not found.", 404);
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  return jsonOk(updated);
});
