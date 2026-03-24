import type { NextFunction, Request, Response } from "express";
import {
  classifyErrorCodeByStatus,
  recordFailedApiCall,
  reportOptionalTelemetry
} from "../services/runtime-diagnostics";

interface ErrorMeta {
  errorCode?: string;
  message?: string;
}

export const observabilityMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const startedAt = request.requestStartedAt ?? Date.now();
  const path = request.originalUrl.split("?")[0] ?? request.originalUrl;

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const errorMeta = (response.locals.errorMeta as ErrorMeta | undefined) ?? {};
    const status = response.statusCode;
    const isFailure = status >= 400;
    const errorCode = isFailure
      ? errorMeta.errorCode ?? classifyErrorCodeByStatus(status)
      : undefined;

    const logPayload = {
      timestamp: new Date().toISOString(),
      level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
      requestId: request.requestId,
      method: request.method,
      path,
      status,
      durationMs,
      errorCode,
      actorId: request.user?.id ?? null,
      actorRole: request.user?.role ?? null,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"]
    };

    console.log(JSON.stringify(logPayload));

    if (isFailure) {
      const failureEntry = {
        timestamp: logPayload.timestamp,
        requestId: request.requestId ?? "unknown",
        method: request.method,
        path,
        status,
        durationMs,
        errorCode: errorCode ?? "UNCLASSIFIED_ERROR",
        message: errorMeta.message ?? "Request failed",
        actorId: request.user?.id ?? null,
        actorRole: request.user?.role ?? null,
        ipAddress: request.ip,
        userAgent: String(request.headers["user-agent"] ?? "")
      };

      recordFailedApiCall(failureEntry);
      void reportOptionalTelemetry(failureEntry);
    }
  });

  next();
};
