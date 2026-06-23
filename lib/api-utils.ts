import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Wraps an API route handler with consistent error handling so every route
 * doesn't need to repeat the same try/catch boilerplate. Converts thrown
 * errors into the right HTTP status + JSON shape:
 *  - AuthError            -> its own status (401/403/404) + message
 *  - ZodError (validation) -> 400 + "Validation failed" + field details
 *  - anything else         -> 500 + "Internal server error"
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof AuthError) {
        return jsonError(err.message, err.status);
      }
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        return jsonError(`Validation failed: ${details}`, 400);
      }
      console.error("API error:", err);
      return jsonError("Internal server error", 500);
    }
  };
}
