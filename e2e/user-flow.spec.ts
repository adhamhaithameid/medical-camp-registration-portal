import { expect, test } from "@playwright/test";

test("user can login and add patient", async ({ page }) => {
  await page.goto("/auth");

  await page.getByLabel("Email").fill("admin@hms.local");
  await page.getByLabel("Password").fill("admin12345");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByRole("heading", { name: /Patient Management/i })).toBeVisible();

  const suffix = Date.now();

  await page.getByLabel("Full Name").fill(`Playwright Patient ${suffix}`);
  await page.getByLabel("Date of Birth").fill("1994-11-20");
  await page.getByLabel("Gender").fill("Female");
  await page.getByLabel("Phone").fill(`+20 100 ${String(suffix).slice(-6)}`);
  await page.getByLabel("Address").fill("Cairo");
  await page.getByLabel("Medical History").fill("Automated e2e patient");

  await page.getByRole("button", { name: "Add Patient" }).click();

  await expect(page.getByText(/Patient added successfully/i)).toBeVisible();
});
