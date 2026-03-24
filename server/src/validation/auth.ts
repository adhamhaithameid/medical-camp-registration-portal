import { z } from "zod";

export const loginInputSchema = z.object({
  username: z.string().trim().min(3).max(40),
  password: z.string().min(8).max(100)
});

export type LoginInput = z.infer<typeof loginInputSchema>;
