import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ms from "ms";
import { getEnv } from "../config/env";

export interface AdminTokenPayload {
  id: number;
  username: string;
}

export const hashPassword = async (plainText: string) => {
  return bcrypt.hash(plainText, 12);
};

export const verifyPassword = async (plainText: string, hashed: string) => {
  return bcrypt.compare(plainText, hashed);
};

export const signAdminToken = (payload: AdminTokenPayload) => {
  const env = getEnv();

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

export const verifyAdminToken = (token: string): AdminTokenPayload => {
  const env = getEnv();
  return jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload;
};

export const getTokenMaxAge = () => {
  const env = getEnv();
  const duration = ms(env.JWT_EXPIRES_IN);
  return typeof duration === "number" ? duration : 8 * 60 * 60 * 1000;
};
