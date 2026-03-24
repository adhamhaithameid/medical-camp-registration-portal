import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+]?[-0-9\s]{7,20}$/u, "Invalid phone number format");

const dateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "dateOfBirth must be a valid date");

export const patientInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  dateOfBirth: dateSchema,
  gender: z.string().trim().min(2).max(20),
  contactNumber: phoneSchema,
  email: z.string().trim().email().max(160).optional(),
  address: z.string().trim().min(5).max(500),
  medicalHistory: z.string().trim().max(5000).optional()
});

export const patientUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    dateOfBirth: dateSchema.optional(),
    gender: z.string().trim().min(2).max(20).optional(),
    contactNumber: phoneSchema.optional(),
    email: z.string().trim().email().max(160).nullable().optional(),
    address: z.string().trim().min(5).max(500).optional(),
    medicalHistory: z.string().trim().max(5000).nullable().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required"
  });
