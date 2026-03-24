import { PrismaClient } from "@prisma/client";

declare global {
  var __prismaClient__: PrismaClient | undefined;
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

export const prisma = global.__prismaClient__ ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prismaClient__ = prisma;
}
