import { z } from "zod";

const scheduledAtSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), "scheduledAt must be a valid date");

export const appointmentInputSchema = z.object({
  patientId: z.number().int().positive(),
  doctorId: z.number().int().positive(),
  scheduledAt: scheduledAtSchema,
  reason: z.string().trim().max(500).optional()
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().max(500).optional()
});

export const rescheduleAppointmentSchema = z.object({
  scheduledAt: scheduledAtSchema,
  reason: z.string().trim().max(500).optional()
});
