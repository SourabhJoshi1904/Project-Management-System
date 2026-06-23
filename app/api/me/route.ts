import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";

// GET /api/me
// Returns the database row for the currently signed-in Clerk user, creating
// it on first contact. Every other API route relies on this same upsert
// logic internally, but the client calls this once on app load so it knows
// its own internal user id (needed to compute "my role" / "assigned to me").
export const GET = withErrorHandling(async (): Promise<NextResponse> => {
  const user = await requireCurrentUser();
  return jsonOk(user);
});
