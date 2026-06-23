/**
 * Thin wrapper around fetch() for calling our own /api/* routes from client
 * components. Every API route responds with either the requested JSON on
 * success, or `{ error: "message" }` (see lib/api-utils.ts) on failure —
 * this throws a plain Error with that message so callers can just
 * try/catch and toast.error(err.message).
 */
export async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Network error — check your connection and try again.");
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : null) ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body as T;
}
