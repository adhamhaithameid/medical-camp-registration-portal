import { beforeEach, describe, expect, it } from "vitest";
import { resetEnvCache } from "../../config/env";
import {
  getTokenMaxAge,
  hashPassword,
  signAuthToken,
  verifyAuthToken,
  verifyPassword
} from "../../utils/auth";

describe("auth utilities", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-12345";
    process.env.JWT_EXPIRES_IN = "2h";
    resetEnvCache();
  });

  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("password123");

    expect(hash).not.toBe("password123");
    await expect(verifyPassword("password123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrongpass", hash)).resolves.toBe(false);
  });

  it("signs and verifies auth tokens", () => {
    const token = signAuthToken({
      id: 10,
      email: "admin@hms.local",
      fullName: "System Admin",
      role: "ADMIN"
    });

    const payload = verifyAuthToken(token);

    expect(payload.id).toBe(10);
    expect(payload.email).toBe("admin@hms.local");
    expect(payload.role).toBe("ADMIN");
  });

  it("computes token max age", () => {
    const maxAge = getTokenMaxAge();
    expect(maxAge).toBe(7_200_000);
  });
});
