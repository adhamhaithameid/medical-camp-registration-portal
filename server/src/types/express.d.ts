import type { AuthTokenPayload } from "../utils/auth";

declare global {
  namespace Express {
    interface Request {
      user?: Pick<AuthTokenPayload, "id" | "username" | "role">;
      requestId?: string;
      requestStartedAt?: number;
    }
  }
}

export {};
