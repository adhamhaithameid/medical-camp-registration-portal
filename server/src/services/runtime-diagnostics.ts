import type { AdminRole } from "@prisma/client";
import { getEnv } from "../config/env";

export interface FailedApiCallRecord {
  timestamp: string;
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  errorCode: string;
  message: string;
  actorId?: number | null;
  actorRole?: AdminRole | null;
  ipAddress?: string;
  userAgent?: string;
}

const MAX_FAILED_CALLS = 250;
const failedApiCalls: FailedApiCallRecord[] = [];

const telemetryWarningState = {
  sentryUnavailableLogged: false,
  otelFailedLogged: false
};

export const classifyErrorCodeByStatus = (status: number) => {
  if (status === 400) {
    return "BAD_REQUEST";
  }
  if (status === 401) {
    return "AUTH_REQUIRED";
  }
  if (status === 403) {
    return "PERMISSION_DENIED";
  }
  if (status === 404) {
    return "NOT_FOUND";
  }
  if (status === 409) {
    return "CONFLICT";
  }
  if (status === 429) {
    return "RATE_LIMITED";
  }
  if (status >= 500) {
    return "INTERNAL_ERROR";
  }

  return "UNCLASSIFIED_ERROR";
};

export const recordFailedApiCall = (entry: FailedApiCallRecord) => {
  failedApiCalls.unshift(entry);

  if (failedApiCalls.length > MAX_FAILED_CALLS) {
    failedApiCalls.length = MAX_FAILED_CALLS;
  }
};

export const listFailedApiCalls = (limit = 50) => failedApiCalls.slice(0, Math.max(1, limit));

export const failedApiCallsCount = () => failedApiCalls.length;

const trySendSentryEvent = async (entry: FailedApiCallRecord) => {
  const env = getEnv();

  if (!env.SENTRY_DSN) {
    return;
  }

  try {
    const sentryModule = (await new Function('return import("@sentry/node")')()) as {
      init: (config: { dsn: string }) => void;
      captureMessage: (message: string, level: "error") => void;
    };
    sentryModule.init({ dsn: env.SENTRY_DSN });
    sentryModule.captureMessage(
      `[${entry.errorCode}] ${entry.method} ${entry.path} -> ${entry.status}`,
      "error"
    );
  } catch {
    if (!telemetryWarningState.sentryUnavailableLogged) {
      telemetryWarningState.sentryUnavailableLogged = true;
      console.warn(
        JSON.stringify({
          level: "warn",
          event: "telemetry.sentry_unavailable",
          message:
            "SENTRY_DSN is configured but @sentry/node is not installed. Falling back to local logs only."
        })
      );
    }
  }
};

const trySendOtelEvent = async (entry: FailedApiCallRecord) => {
  const env = getEnv();

  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return;
  }

  try {
    await fetch(env.OTEL_EXPORTER_OTLP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "hospital-management-system",
        event: "api.error",
        ...entry
      })
    });
  } catch {
    if (!telemetryWarningState.otelFailedLogged) {
      telemetryWarningState.otelFailedLogged = true;
      console.warn(
        JSON.stringify({
          level: "warn",
          event: "telemetry.otel_unreachable",
          message:
            "OTEL_EXPORTER_OTLP_ENDPOINT is configured but telemetry export failed. Falling back to local logs only."
        })
      );
    }
  }
};

export const reportOptionalTelemetry = async (entry: FailedApiCallRecord) => {
  await Promise.allSettled([trySendSentryEvent(entry), trySendOtelEvent(entry)]);
};
