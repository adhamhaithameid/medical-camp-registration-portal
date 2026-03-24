import type { AuthTokenPayload } from "../utils/auth";

declare global {
  namespace Express {
    interface Request {
      user?: Pick<AuthTokenPayload, "id" | "email" | "fullName" | "role">;
    }
  }
}

export {};
