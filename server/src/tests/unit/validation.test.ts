import { describe, expect, it } from "vitest";
import { registrationInputSchema } from "../../validation/registration";

describe("registrationInputSchema", () => {
  it("accepts a valid payload", () => {
    const payload = {
      fullName: "Sara Ahmed",
      age: 28,
      contactNumber: "+20 100 123 4567",
      campId: 1
    };

    const parsed = registrationInputSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid payload fields", () => {
    const payload = {
      fullName: "",
      age: 0,
      contactNumber: "abc",
      campId: -1
    };

    const parsed = registrationInputSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});
