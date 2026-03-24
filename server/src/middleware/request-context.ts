import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const requestContext = (request: Request, response: Response, next: NextFunction) => {
  const incomingRequestId = request.headers["x-request-id"];
  const parsedRequestId =
    typeof incomingRequestId === "string" && incomingRequestId.trim()
      ? incomingRequestId.trim()
      : null;

  request.requestId = parsedRequestId ?? randomUUID();
  request.requestStartedAt = Date.now();
  response.setHeader("x-request-id", request.requestId);

  const originalJson = response.json.bind(response);

  response.json = ((body: unknown) => {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const objectBody = body as Record<string, unknown>;
      if (objectBody.requestId === undefined && request.requestId) {
        return originalJson({
          ...objectBody,
          requestId: request.requestId
        });
      }
    }

    return originalJson(body);
  }) as Response["json"];

  next();
};
