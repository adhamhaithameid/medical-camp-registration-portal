import { ZodError } from "zod";
import type { NextFunction, Request, Response } from "express";
import { sendError, sendValidationError } from "../utils/http";

export const errorHandler = (
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return sendValidationError(request, response, error);
  }

  if (error instanceof Error) {
    return sendError(request, response, 500, error.message, {
      errorCode: "INTERNAL_ERROR"
    });
  }

  return sendError(request, response, 500, "Unexpected server error", {
    errorCode: "INTERNAL_ERROR"
  });
};
