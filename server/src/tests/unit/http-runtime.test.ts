import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetEnvCache } from "../../config/env";
import {
  classifyErrorCodeByStatus,
  failedApiCallsCount,
  listFailedApiCalls,
  recordFailedApiCall,
  reportOptionalTelemetry,
  type FailedApiCallRecord
} from "../../services/runtime-diagnostics";
import {
  buildFieldErrors,
  inferErrorCode,
  sendError,
  sendValidationError
} from "../../utils/http";

const createResponseMock = () => {
  const response = {
    locals: {},
    status: vi.fn(),
    json: vi.fn()
  };

  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);

  return response;
};

const sampleFailedCall: FailedApiCallRecord = {
  timestamp: new Date().toISOString(),
  requestId: "req-runtime-1",
  method: "POST",
  path: "/api/example",
  status: 500,
  durationMs: 12,
  errorCode: "INTERNAL_ERROR",
  message: "Failure example",
  actorId: null,
  actorRole: null,
  ipAddress: "::1",
  userAgent: "vitest"
};

describe("http utility helpers", () => {
  it("infers error code from status", () => {
    expect(inferErrorCode(400)).toBe("BAD_REQUEST");
    expect(inferErrorCode(404)).toBe("NOT_FOUND");
    expect(inferErrorCode(500)).toBe("INTERNAL_ERROR");
    expect(inferErrorCode(418)).toBe("BAD_REQUEST");
  });

  it("builds grouped field errors", () => {
    const fieldErrors = buildFieldErrors([
      { path: ["age"], message: "Age is required" },
      { path: ["age"], message: "Age must be positive" },
      { path: ["address", "city"], message: "City is required" },
      { path: [], message: "Invalid payload" }
    ]);

    expect(fieldErrors).toEqual({
      age: ["Age is required", "Age must be positive"],
      "address.city": ["City is required"],
      __root: ["Invalid payload"]
    });
  });

  it("sends structured error payload with request id", () => {
    const request = { requestId: "req-123" } as any;
    const response = createResponseMock();

    sendError(request, response as any, 404, "Resource missing");

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.locals).toEqual({
      errorMeta: {
        message: "Resource missing",
        errorCode: "NOT_FOUND"
      }
    });
    expect(response.json).toHaveBeenCalledWith({
      message: "Resource missing",
      errorCode: "NOT_FOUND",
      requestId: "req-123"
    });
  });

  it("sends validation error details and fieldErrors", () => {
    const request = { requestId: "req-validation" } as any;
    const response = createResponseMock();

    sendValidationError(request, response as any, {
      issues: [
        { path: ["fullName"], message: "Full name is required" },
        { path: ["age"], message: "Age must be greater than 0" }
      ]
    } as any);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      message: "Validation failed",
      errorCode: "VALIDATION_ERROR",
      details: ["Full name is required", "Age must be greater than 0"],
      fieldErrors: {
        fullName: ["Full name is required"],
        age: ["Age must be greater than 0"]
      },
      requestId: "req-validation"
    });
  });
});

describe("runtime diagnostics service", () => {
  const originalSentryDsn = process.env.SENTRY_DSN;
  const originalOtelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  beforeEach(() => {
    process.env.SENTRY_DSN = "";
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "";
    resetEnvCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.SENTRY_DSN = originalSentryDsn;
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = originalOtelEndpoint;
    resetEnvCache();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("classifies runtime error codes by status", () => {
    expect(classifyErrorCodeByStatus(400)).toBe("BAD_REQUEST");
    expect(classifyErrorCodeByStatus(401)).toBe("AUTH_REQUIRED");
    expect(classifyErrorCodeByStatus(403)).toBe("PERMISSION_DENIED");
    expect(classifyErrorCodeByStatus(404)).toBe("NOT_FOUND");
    expect(classifyErrorCodeByStatus(409)).toBe("CONFLICT");
    expect(classifyErrorCodeByStatus(429)).toBe("RATE_LIMITED");
    expect(classifyErrorCodeByStatus(500)).toBe("INTERNAL_ERROR");
    expect(classifyErrorCodeByStatus(418)).toBe("UNCLASSIFIED_ERROR");
  });

  it("records and returns failed API calls", () => {
    const beforeCount = failedApiCallsCount();
    recordFailedApiCall(sampleFailedCall);

    expect(failedApiCallsCount()).toBe(beforeCount + 1);
    expect(listFailedApiCalls(1)[0]?.requestId).toBe("req-runtime-1");
    expect(listFailedApiCalls(0).length).toBeGreaterThanOrEqual(1);
  });

  it("skips telemetry exporters when integrations are not configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await reportOptionalTelemetry(sampleFailedCall);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to OTEL endpoint when configured", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = "http://localhost:4318/v1/logs";
    resetEnvCache();

    await reportOptionalTelemetry(sampleFailedCall);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:4318/v1/logs",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );
  });
});
