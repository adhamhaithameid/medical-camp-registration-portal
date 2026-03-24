import type { NextFunction, Request, Response } from "express";
import type { AdminRole } from "@prisma/client";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../utils/auth";

export const requireAuth = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const token = request.cookies?.[AUTH_COOKIE_NAME];

    if (!token) {
      return response.status(401).json({ message: "Authentication required" });
    }

    const payload = verifyAuthToken(token);
    request.user = {
      id: payload.id,
      username: payload.username,
      role: payload.role
    };

    return next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired session" });
  }
};

export const requireRoles = (...roles: AdminRole[]) => {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user) {
      return response.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(request.user.role)) {
      return response.status(403).json({ message: "You do not have permission for this action" });
    }

    return next();
  };
};
