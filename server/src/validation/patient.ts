import { z } from "zod";

const birthDateSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "dateOfBirth must be a valid date");

export const patientInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  dateOfBirth: birthDateSchema,
  gender: z.string().trim().min(2).max(30),
  phone: z.string().trim().regex(/^[+]?[-0-9\s]{7,20}$/u, "Invalid phone number format"),
  address: z.string().trim().min(5).max(220),
  medicalHistory: z.string().trim().max(2000).optional()
});

export const patientUpdateSchema = patientInputSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  "At least one field is required"
);

export type PatientInputParsed = z.infer<typeof patientInputSchema>;
export type PatientUpdateParsed = z.infer<typeof patientUpdateSchema>;
