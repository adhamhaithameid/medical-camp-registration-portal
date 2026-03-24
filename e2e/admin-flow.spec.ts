import { test, expect } from "@playwright/test";

test("admin can login and view registrations", async ({ page }) => {
  await page.goto("/admin/login");

  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin12345");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByRole("heading", { name: /Registered Participants/i })).toBeVisible();
});
