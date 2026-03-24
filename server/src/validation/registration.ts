import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+]?[-0-9\s]{7,20}$/u, "Invalid phone number format");

export const registrationInputSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  age: z.number().int().min(1).max(120),
  contactNumber: phoneSchema,
  email: z.string().trim().email().max(160).optional(),
  campId: z.number().int().positive()
});

export const registrationUpdateSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    age: z.number().int().min(1).max(120).optional(),
    contactNumber: phoneSchema.optional(),
    email: z.string().trim().email().max(160).nullable().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required"
  });

export const confirmationCodeSchema = z.object({
  confirmationCode: z.string().trim().min(8).max(64)
});

export const adminRegistrationsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  campId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : undefined)),
  status: z.enum(["CONFIRMED", "WAITLISTED", "CANCELLED"]).optional(),
  dateFrom: z
    .string()
    .trim()
    .optional()
    .refine((value) => (value ? !Number.isNaN(Date.parse(value)) : true), {
      message: "dateFrom must be a valid date"
    }),
  dateTo: z
    .string()
    .trim()
    .optional()
    .refine((value) => (value ? !Number.isNaN(Date.parse(value)) : true), {
      message: "dateTo must be a valid date"
    }),
  page: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : 1)),
  pageSize: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? Number(value) : 20)),
  sortBy: z.enum(["createdAt", "campDate", "status", "fullName"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional()
});

export const promoteRegistrationSchema = z.object({
  registrationId: z.number().int().positive()
});
