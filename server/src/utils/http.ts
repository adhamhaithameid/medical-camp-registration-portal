import type { Request, Response } from "express";
import type { ZodError } from "zod";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_REQUIRED"
  | "AUTH_INVALID_SESSION"
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST";

const defaultErrorCodeByStatus: Record<number, ErrorCode> = {
  400: "BAD_REQUEST",
  401: "AUTH_REQUIRED",
  403: "PERMISSION_DENIED",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED"
};

export const inferErrorCode = (status: number): ErrorCode =>
  defaultErrorCodeByStatus[status] ?? (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");

const toFieldKey = (path: Array<string | number>) =>
  path.length > 0 ? path.map((segment) => String(segment)).join(".") : "__root";

export const buildFieldErrors = (
  issues: Array<{
    path: Array<string | number>;
    message: string;
  }>
) => {
  const fieldErrors: Record<string, string[]> = {};

  issues.forEach((issue) => {
    const key = toFieldKey(issue.path);
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  });

  return fieldErrors;
};

interface SendErrorOptions {
  errorCode?: ErrorCode | string;
  details?: string[];
  fieldErrors?: Record<string, string[]>;
}

export const sendError = (
  request: Request,
  response: Response,
  status: number,
  message: string,
  options: SendErrorOptions = {}
) => {
  const errorCode = options.errorCode ?? inferErrorCode(status);
  const payload = {
    message,
    errorCode,
    ...(options.details ? { details: options.details } : {}),
    ...(options.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
    ...(request.requestId ? { requestId: request.requestId } : {})
  };

  response.locals.errorMeta = {
    message,
    errorCode
  };

  return response.status(status).json(payload);
};

export const sendValidationError = (
  request: Request,
  response: Response,
  error: Pick<ZodError, "issues">
) => {
  const details = error.issues.map((issue) => issue.message);
  const fieldErrors = buildFieldErrors(error.issues);

  return sendError(request, response, 400, "Validation failed", {
    errorCode: "VALIDATION_ERROR",
    details,
    fieldErrors
  });
};
