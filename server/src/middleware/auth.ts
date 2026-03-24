import type { NextFunction, Request, Response } from "express";
import { verifyAdminToken } from "../utils/auth";

export const requireAdminAuth = (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const token = request.cookies?.mcamp_admin_token;

    if (!token) {
      return response.status(401).json({ message: "Authentication required" });
    }

    const payload = verifyAdminToken(token);
    request.admin = { id: payload.id, username: payload.username };
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired session" });
  }
};
