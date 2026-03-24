import type { AdminTokenPayload } from "../utils/auth";

declare global {
  namespace Express {
    interface Request {
      admin?: Pick<AdminTokenPayload, "id" | "username">;
    }
  }
}

export {};
