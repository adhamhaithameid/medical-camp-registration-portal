import { Router } from "express";
import type { AuthStatusResponse } from "@medical-camp/shared";
import { prisma } from "../config/prisma";
import { loginInputSchema } from "../validation/auth";
import {
  getTokenMaxAge,
  signAdminToken,
  verifyAdminToken,
  verifyPassword
} from "../utils/auth";

const authRouter = Router();

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: getTokenMaxAge()
});

authRouter.post("/login", async (request, response) => {
  const parsed = loginInputSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { username: parsed.data.username }
  });

  if (!admin) {
    return response.status(401).json({ message: "Invalid username or password" });
  }

  const isPasswordValid = await verifyPassword(
    parsed.data.password,
    admin.passwordHash
  );

  if (!isPasswordValid) {
    return response.status(401).json({ message: "Invalid username or password" });
  }

  const token = signAdminToken({ id: admin.id, username: admin.username });

  response.cookie("mcamp_admin_token", token, getCookieOptions());

  return response.status(200).json({
    authenticated: true,
    adminUsername: admin.username
  });
});

authRouter.post("/logout", (_request, response) => {
  response.clearCookie("mcamp_admin_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response.status(200).json({ authenticated: false });
});

authRouter.get("/status", (request, response) => {
  const token = request.cookies?.mcamp_admin_token;

  if (!token) {
    const payload: AuthStatusResponse = { auth: { authenticated: false } };
    return response.status(200).json(payload);
  }

  try {
    const session = verifyAdminToken(token);
    const payload: AuthStatusResponse = {
      auth: {
        authenticated: true,
        adminUsername: session.username
      }
    };

    return response.status(200).json(payload);
  } catch {
    return response.status(200).json({ auth: { authenticated: false } });
  }
});

export { authRouter };
