import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .default("4000")
    .transform((value) => Number(value)),
  DATABASE_URL: z.string().default("file:./dev.db"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(10).default("replace-this-secret"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  DEFAULT_USER_FULL_NAME: z.string().default("System Admin"),
  DEFAULT_USER_EMAIL: z.string().email().default("admin@hms.local"),
  DEFAULT_USER_PASSWORD: z.string().min(8).default("admin12345")
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export const getEnv = (): AppEnv => {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
};

export const resetEnvCache = () => {
  cachedEnv = null;
};
