import { expect, test } from "@playwright/test";

test("user can browse camps and submit registration", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Complete Hospital Management System/i })).toBeVisible();

  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Camp Registration" })).toBeVisible();

  const suffix = Date.now();
  await page.getByLabel("Full Name").fill(`Playwright User ${suffix}`);
  await page.getByLabel("Age").fill("25");
  await page.getByLabel("Contact Number").fill(`+20 100 ${String(suffix).slice(-6)}`);
  await page.getByLabel("Email (optional)").fill(`playwright.user.${suffix}@example.com`);

  await page.getByRole("button", { name: "Submit Registration" }).click();

  await expect(page.getByText(/confirmation code/i)).toBeVisible();
});
