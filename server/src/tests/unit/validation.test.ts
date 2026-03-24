import { describe, expect, it } from "vitest";
import { billingCalculateSchema } from "../../validation/billing";
import { patientInputSchema } from "../../validation/patient";

describe("patientInputSchema", () => {
  it("accepts a valid payload", () => {
    const payload = {
      fullName: "Sara Ahmed",
      dateOfBirth: "1996-04-04",
      gender: "Female",
      phone: "+20 100 123 4567",
      address: "Cairo, Egypt",
      medicalHistory: "No chronic conditions"
    };

    const parsed = patientInputSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid payload fields", () => {
    const payload = {
      fullName: "",
      dateOfBirth: "invalid-date",
      gender: "",
      phone: "abc",
      address: "",
      medicalHistory: ""
    };

    const parsed = patientInputSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });
});

describe("billingCalculateSchema", () => {
  it("accepts invoice item list", () => {
    const parsed = billingCalculateSchema.safeParse({
      items: [
        { description: "Consultation", quantity: 1, unitPrice: 300 },
        { description: "X-Ray", quantity: 2, unitPrice: 120 }
      ]
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty item list", () => {
    const parsed = billingCalculateSchema.safeParse({ items: [] });
    expect(parsed.success).toBe(false);
  });
});
