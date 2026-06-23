import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@/types";

/**
 * Ensures the currently-signed-in Clerk user has a matching row in our own
 * `User` collection (Prisma/MongoDB), and returns that row.
 *
 * Clerk only manages auth (email/password/sessions) — it has no idea about
 * our projects/tasks/members. So the first time a Clerk user hits any API
 * route, we "mirror" their basic profile into our own database keyed by
 * `clerkId`. Every later call just reads that row.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? `${userId}@unknown.local`;
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    email.split("@")[0];

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      name,
      email,
      image: clerkUser?.imageUrl ?? null,
    },
    create: {
      clerkId: userId,
      name,
      email,
      image: clerkUser?.imageUrl ?? null,
    },
  });

  return user;
}

/**
 * Same as getCurrentUser(), but throws an AuthError the API route handlers
 * know how to turn into a 401 response. Use this in routes where a missing
 * user should never happen (middleware already protects the route) but we
 * still want a typed, non-null user.
 */
export class AuthError extends Error {
  status: number;
  constructor(message = "Unauthorized", status = 401) {
    super(message);
    this.status = status;
  }
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("You must be signed in.", 401);
  return user;
}
