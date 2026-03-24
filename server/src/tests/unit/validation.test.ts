import { describe, expect, it } from "vitest";
import { campInputSchema } from "../../validation/camp";
import { loginInputSchema } from "../../validation/auth";
import { registrationInputSchema, registrationUpdateSchema } from "../../validation/registration";

describe("campInputSchema", () => {
  it("accepts a valid camp payload", () => {
    const parsed = campInputSchema.safeParse({
      name: "General Checkup Camp",
      date: "2026-05-21T09:00:00.000Z",
      location: "Giza Community Clinic",
      description: "Free checkup with doctors and basic screening.",
      capacity: 120,
      isActive: true
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid camp payload", () => {
    const parsed = campInputSchema.safeParse({
      name: "",
      date: "invalid-date",
      location: "",
      description: "short",
      capacity: 0
    });

    expect(parsed.success).toBe(false);
  });
});

describe("registrationInputSchema", () => {
  it("accepts valid registration payload", () => {
    const parsed = registrationInputSchema.safeParse({
      fullName: "Laila Ahmed",
      age: 29,
      contactNumber: "+20 100 123 4567",
      email: "laila@example.com",
      campId: 2
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid registration payload", () => {
    const parsed = registrationInputSchema.safeParse({
      fullName: "",
      age: -2,
      contactNumber: "abc",
      campId: 0
    });

    expect(parsed.success).toBe(false);
  });
});

describe("registrationUpdateSchema", () => {
  it("requires at least one field", () => {
    const parsed = registrationUpdateSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });
});

describe("loginInputSchema", () => {
  it("accepts valid admin login payload", () => {
    const parsed = loginInputSchema.safeParse({
      username: "admin",
      password: "admin12345"
    });

    expect(parsed.success).toBe(true);
  });
});
