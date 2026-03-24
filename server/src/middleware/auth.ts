import type { NextFunction, Request, Response } from "express";
import type { AdminRole } from "@prisma/client";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../utils/auth";
import { sendError } from "../utils/http";

export const requireAuth = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const token = request.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      return sendError(request, response, 401, "Authentication required", {
        errorCode: "AUTH_REQUIRED"
      });
    }

    const payload = verifyAuthToken(token);
    request.user = {
      id: payload.id,
      username: payload.username,
      role: payload.role
    };

    return next();
  } catch {
    return sendError(request, response, 401, "Invalid or expired session", {
      errorCode: "AUTH_INVALID_SESSION"
    });
  }
};

export const requireRoles = (...roles: AdminRole[]) => {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user) {
      return sendError(request, response, 401, "Authentication required", {
        errorCode: "AUTH_REQUIRED"
      });
    }

    if (!roles.includes(request.user.role)) {
      return sendError(request, response, 403, "You do not have permission for this action", {
        errorCode: "PERMISSION_DENIED"
      });
    }

    return next();
  };
};
