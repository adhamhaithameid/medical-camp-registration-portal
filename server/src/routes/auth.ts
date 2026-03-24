import { Router } from "express";
import type { AuthResult, AuthStatusResponse } from "@medical-camp/shared";
import { prisma } from "../config/prisma";
import { recordAudit } from "../services/audit";
import { createAdminUserSchema, loginInputSchema, updateAdminUserSchema } from "../validation/auth";
import {
  AUTH_COOKIE_NAME,
  getTokenMaxAge,
  hashPassword,
  signAuthToken,
  verifyAuthToken,
  verifyPassword
} from "../utils/auth";
import { requireAuth, requireRoles } from "../middleware/auth";
import { mapAdminUser } from "../utils/mappers";

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

  const user = await prisma.adminUser.findUnique({
    where: { username: parsed.data.username }
  });

  if (!user || !user.isActive) {
    return response.status(401).json({ message: "Invalid username or password" });
  }

  const isPasswordValid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!isPasswordValid) {
    return response.status(401).json({ message: "Invalid username or password" });
  }

  const token = signAuthToken({
    id: user.id,
    username: user.username,
    role: user.role
  });

  response.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

  await recordAudit({
    request,
    action: "AUTH_LOGIN",
    entityType: "AdminUser",
    entityId: String(user.id),
    actorOverride: {
      id: user.id,
      role: user.role
    }
  });

  const payload: AuthResult = {
    authenticated: true,
    adminUsername: user.username,
    role: user.role,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };

  return response.status(200).json(payload);
});

authRouter.post("/logout", async (request, response) => {
  response.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  if (request.user) {
    await recordAudit({
      request,
      action: "AUTH_LOGOUT",
      entityType: "AdminUser",
      entityId: String(request.user.id)
    });
  }

  return response.status(200).json({ authenticated: false });
});

authRouter.get("/status", async (request, response) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME];

  if (!token) {
    const payload: AuthStatusResponse = { auth: { authenticated: false } };
    return response.status(200).json(payload);
  }

  try {
    const session = verifyAuthToken(token);
    const user = await prisma.adminUser.findUnique({
      where: { id: session.id }
    });

    if (!user || !user.isActive) {
      const payload: AuthStatusResponse = { auth: { authenticated: false } };
      return response.status(200).json(payload);
    }

    const payload: AuthStatusResponse = {
      auth: {
        authenticated: true,
        adminUsername: user.username,
        role: user.role,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      }
    };

    return response.status(200).json(payload);
  } catch {
    return response.status(200).json({ auth: { authenticated: false } });
  }
});

const usersRouter = Router();

usersRouter.use(requireAuth, requireRoles("SUPER_ADMIN"));

usersRouter.get("/", async (_request, response) => {
  const users = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" }
  });

  return response.status(200).json({ users: users.map(mapAdminUser) });
});

usersRouter.post("/", async (request, response) => {
  const parsed = createAdminUserSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const existing = await prisma.adminUser.findUnique({
    where: { username: parsed.data.username }
  });

  if (existing) {
    return response.status(409).json({ message: "Username already exists" });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.adminUser.create({
    data: {
      username: parsed.data.username,
      passwordHash,
      role: parsed.data.role
    }
  });

  await recordAudit({
    request,
    action: "ADMIN_USER_CREATE",
    entityType: "AdminUser",
    entityId: String(user.id),
    details: { role: user.role, username: user.username }
  });

  return response.status(201).json({ user: mapAdminUser(user) });
});

usersRouter.patch("/:id", async (request, response) => {
  const userId = Number(request.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return response.status(400).json({ message: "Invalid user id" });
  }

  const parsed = updateAdminUserSchema.safeParse(request.body);

  if (!parsed.success) {
    return response.status(400).json({
      message: "Validation failed",
      details: parsed.error.issues.map((issue) => issue.message)
    });
  }

  const existing = await prisma.adminUser.findUnique({
    where: { id: userId }
  });

  if (!existing) {
    return response.status(404).json({ message: "User not found" });
  }

  const updated = await prisma.adminUser.update({
    where: { id: userId },
    data: {
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      ...(parsed.data.password
        ? { passwordHash: await hashPassword(parsed.data.password) }
        : {})
    }
  });

  await recordAudit({
    request,
    action: "ADMIN_USER_UPDATE",
    entityType: "AdminUser",
    entityId: String(updated.id),
    details: {
      role: parsed.data.role,
      isActive: parsed.data.isActive,
      passwordChanged: Boolean(parsed.data.password)
    }
  });

  return response.status(200).json({ user: mapAdminUser(updated) });
});

export { authRouter, usersRouter };
