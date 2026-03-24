import { z } from "zod";

export const registrationInputSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  age: z.number().int().min(1).max(120),
  contactNumber: z
    .string()
    .trim()
    .regex(/^[+]?[-0-9\s]{7,20}$/u, "Invalid contact number format"),
  campId: z.number().int().positive()
});

export type RegistrationInputParsed = z.infer<typeof registrationInputSchema>;
