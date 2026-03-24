import { expect, test } from "@playwright/test";

test("user can add doctor and view row", async ({ page }) => {
  await page.goto("/auth");

  await page.getByLabel("Email").fill("admin@hms.local");
  await page.getByLabel("Password").fill("admin12345");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: /Patient Management/i })).toBeVisible();

  await page.goto("/doctors");
  await expect(page.getByRole("heading", { name: /Doctor Management/i })).toBeVisible();

  const suffix = Date.now();
  const doctorName = `Playwright Doctor ${suffix}`;

  await page.getByLabel("Full Name").fill(doctorName);
  await page.getByLabel("Email").fill(`playwright.doctor.${suffix}@hms.local`);
  await page.getByLabel("Phone").fill(`+20 111 ${String(suffix).slice(-6)}`);
  await page.getByLabel("Specialization").fill("General Medicine");
  await page.getByLabel("Schedule").fill("Mon-Fri 09:00-15:00");

  await page.getByRole("button", { name: "Add Doctor" }).click();

  await expect(page.getByText(/Doctor added successfully/i)).toBeVisible();
  await expect(page.getByText(doctorName)).toBeVisible();
});
