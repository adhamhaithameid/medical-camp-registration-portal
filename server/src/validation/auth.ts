import { z } from "zod";

const userRoleSchema = z.enum(["ADMIN", "STAFF", "RECEPTIONIST"]);

export const registerInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(120),
  role: userRoleSchema.optional()
});

export const loginInputSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(120)
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
