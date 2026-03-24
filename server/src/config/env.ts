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
  CORS_ORIGIN: z
    .string()
    .default(
      "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4000,http://127.0.0.1:4000"
    ),
  JWT_SECRET: z.string().min(10).default("replace-this-secret"),
  JWT_EXPIRES_IN: z.string().default("8h"),
  DEFAULT_SUPER_ADMIN_USERNAME: z.string().default("admin"),
  DEFAULT_SUPER_ADMIN_PASSWORD: z.string().min(8).default("admin12345"),
  DEFAULT_STAFF_USERNAME: z.string().default("staff"),
  DEFAULT_STAFF_PASSWORD: z.string().min(8).default("staff12345"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  DEFAULT_NOTIFICATION_EMAIL_DOMAIN: z.string().default("camp.local")
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
