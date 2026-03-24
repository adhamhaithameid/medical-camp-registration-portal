import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+]?[-0-9\s]{7,20}$/u, "Invalid phone number format");

export const doctorInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  contactNumber: phoneSchema,
  specialization: z.string().trim().min(2).max(120),
  department: z.string().trim().max(120).optional(),
  isActive: z.boolean().optional()
});

export const doctorUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(160).optional(),
    contactNumber: phoneSchema.optional(),
    specialization: z.string().trim().min(2).max(120).optional(),
    department: z.string().trim().max(120).nullable().optional(),
    isActive: z.boolean().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required"
  });
