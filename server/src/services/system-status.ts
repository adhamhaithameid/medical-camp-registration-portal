import { prisma } from "../config/prisma";
import { getEnv } from "../config/env";

export interface SystemHealthSnapshot {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  dependencies: {
    database: "up" | "down";
  };
  telemetry: {
    sentryEnabled: boolean;
    otelEnabled: boolean;
  };
}

export const getSystemHealthSnapshot = async (): Promise<SystemHealthSnapshot> => {
  let databaseStatus: "up" | "down" = "up";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseStatus = "down";
  }

  const env = getEnv();

  return {
    status: databaseStatus === "up" ? "ok" : "degraded",
    service: "hospital-management-system",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    dependencies: {
      database: databaseStatus
    },
    telemetry: {
      sentryEnabled: Boolean(env.SENTRY_DSN),
      otelEnabled: Boolean(env.OTEL_EXPORTER_OTLP_ENDPOINT)
    }
  };
};
