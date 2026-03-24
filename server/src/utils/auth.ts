import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ms from "ms";
import type { AdminRole } from "@prisma/client";
import { getEnv } from "../config/env";

export const AUTH_COOKIE_NAME = "mcamp_admin_token";

export interface AuthTokenPayload {
  id: number;
  username: string;
  role: AdminRole;
}

export const hashPassword = async (plainText: string) => {
  return bcrypt.hash(plainText, 12);
};

export const verifyPassword = async (plainText: string, hashed: string) => {
  return bcrypt.compare(plainText, hashed);
};

export const signAuthToken = (payload: AuthTokenPayload) => {
  const env = getEnv();

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  const env = getEnv();
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
};

export const getTokenMaxAge = () => {
  const env = getEnv();
  const duration = ms(env.JWT_EXPIRES_IN);
  return typeof duration === "number" ? duration : 8 * 60 * 60 * 1000;
};
