import { z } from "zod";

/**
 * These schemas are the single source of truth for validation. API routes
 * import them directly so the server never trusts client input. Client-side
 * forms (react-hook-form + zodResolver) import the same schemas so users get
 * instant feedback that matches exactly what the server will accept.
 */

// A deadline is always optional, but if one IS provided it must actually
// parse to a real date — protects the API (which can be called directly,
// bypassing the <input type="date"> picker) from things like "not-a-date"
// or a malformed string slipping through as a "valid" deadline.
const optionalDeadline = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  });

export const projectCreateSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(80, "Title is too long"),
  description: z.string().trim().max(500, "Description is too long").optional().or(z.literal("")),
  deadline: optionalDeadline,
});
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(80, "Title is too long").optional(),
  description: z.string().trim().max(500, "Description is too long").optional().or(z.literal("")),
  deadline: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), { message: "Please enter a valid date" }),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
});
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const taskCreateSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  description: z.string().trim().max(1000, "Description is too long").optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  deadline: optionalDeadline,
  projectId: z.string().min(1, "projectId is required"),
  assignedToId: z.string().nullable().optional(),
});
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(100, "Title is too long").optional(),
  description: z.string().trim().max(1000, "Description is too long").optional().or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  deadline: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), { message: "Please enter a valid date" }),
  assignedToId: z.string().nullable().optional(),
});
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

// A member can be added either by picking an existing user (userId) or by
// typing their email address (email) — exactly one of the two is required.
// Email format itself is validated by z.string().email().
export const memberAddSchema = z
  .object({
    userId: z.string().trim().optional(),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").optional().or(z.literal("")),
    role: z.enum(["ADMIN", "MANAGER", "MEMBER"]).default("MEMBER"),
  })
  .refine((data) => !!data.userId || !!data.email, {
    message: "Select a member or enter an email address",
    path: ["userId"],
  });
export type MemberAddInput = z.infer<typeof memberAddSchema>;

export const memberUpdateSchema = z.object({
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]),
});
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;

export const commentCreateSchema = z.object({
  message: z.string().trim().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});
export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
