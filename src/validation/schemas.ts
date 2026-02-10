import { z } from "zod";

/* ────────────────────────────────────────────
 * CreateStudio form schema
 * ──────────────────────────────────────────── */

export const createStudioSchema = z.object({
  name: z
    .string()
    .min(1, "Studio name is required")
    .max(120, "Studio name must be 120 characters or fewer"),
  email: z
    .union([z.literal(""), z.string().email("Please enter a valid email address")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  phone: z
    .union([z.literal(""), z.string().max(30, "Phone number is too long")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type CreateStudioFormValues = z.input<typeof createStudioSchema>;

/* ────────────────────────────────────────────
 * CreateAdminUser form schema
 * ──────────────────────────────────────────── */

export const createAdminUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be 128 characters or fewer"),
});

export type CreateAdminUserFormValues = z.input<typeof createAdminUserSchema>;

/* ────────────────────────────────────────────
 * Login form schema
 * ──────────────────────────────────────────── */

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export type LoginFormValues = z.input<typeof loginSchema>;
