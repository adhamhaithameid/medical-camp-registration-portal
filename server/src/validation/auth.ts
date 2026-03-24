import { z } from "zod";

const adminRoleSchema = z.enum(["SUPER_ADMIN", "STAFF"]);

export const loginInputSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(8).max(120)
});

export const createAdminUserSchema = z.object({
  username: z.string().trim().min(3).max(64),
  password: z.string().min(8).max(120),
  role: adminRoleSchema
});

export const updateAdminUserSchema = z
  .object({
    role: adminRoleSchema.optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).max(120).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });
