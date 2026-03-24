import { Router } from "express";
import type { AuthStatusResponse } from "@medical-camp/shared";
import { prisma } from "../config/prisma";
import { loginInputSchema, registerInputSchema } from "../validation/auth";
import {
  AUTH_COOKIE_NAME,
  getTokenMaxAge,
  hashPassword,
  signAuthToken,
  verifyAuthToken,
  verifyPassword
} from "../utils/auth";

const authRouter = Router();

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: getTokenMaxAge()
});

authRouter.post("/register", async (request, response) => {
  const parsed = registerInputSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (existing) {
    return response.status(409).json({ message: "A user with this email already exists" });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role ?? "STAFF"
    }
  });

  const token = signAuthToken({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  });

  response.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

  return response.status(201).json({
    authenticated: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  });
});

authRouter.post("/login", async (request, response) => {
  const parsed = loginInputSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email }
  });

  if (!user) {
    return response.status(401).json({ message: "Invalid email or password" });
  }

  const isPasswordValid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!isPasswordValid) {
    return response.status(401).json({ message: "Invalid email or password" });
  }

  const token = signAuthToken({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role
  });

  response.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

  return response.status(200).json({
    authenticated: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    }
  });
});

authRouter.post("/logout", (_request, response) => {
  response.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response.status(200).json({ authenticated: false });
});

authRouter.get("/status", (request, response) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    const payload: AuthStatusResponse = { auth: { authenticated: false } };
    return response.status(200).json(payload);
  }

  try {
    const session = verifyAuthToken(token);
    const payload: AuthStatusResponse = {
      auth: {
        authenticated: true,
        user: {
          id: session.id,
          fullName: session.fullName,
          email: session.email,
          role: session.role
        }
      }
    };

    return response.status(200).json(payload);
  } catch {
    return response.status(200).json({ auth: { authenticated: false } });
  }
});

export { authRouter };
