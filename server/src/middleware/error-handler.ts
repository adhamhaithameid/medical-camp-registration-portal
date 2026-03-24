import { ZodError } from "zod";
import type { NextFunction, Request, Response } from "express";

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Validation failed",
      details: error.issues.map((issue) => issue.message)
    });
  }

  if (error instanceof Error) {
    return response.status(500).json({ message: error.message });
  }

  return response.status(500).json({ message: "Unexpected server error" });
};
