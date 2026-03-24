import { z } from "zod";

const campDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "date must be a valid date");

export const campInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  date: campDateSchema,
  location: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(4000),
  capacity: z.number().int().min(1).max(10000),
  isActive: z.boolean().optional()
});

export const campUpdateSchema = campInputSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one field is required"
);
