import { z } from "zod";

export const doctorInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().regex(/^[+]?[-0-9\s]{7,20}$/u, "Invalid phone number format"),
  specialization: z.string().trim().min(2).max(120),
  schedule: z.string().trim().min(2).max(500)
});

export const specializationSchema = z.object({
  specialization: z.string().trim().min(2).max(120)
});

export const scheduleSchema = z.object({
  schedule: z.string().trim().min(2).max(500)
});

export type DoctorInputParsed = z.infer<typeof doctorInputSchema>;
