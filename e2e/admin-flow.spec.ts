import { expect, test } from "@playwright/test";

test("admin can login and view registrations table", async ({ page }) => {
  await page.goto("/admin/login");

  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin12345");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page.getByRole("heading", { name: /Admin Registrations/i })).toBeVisible();
  await expect(page.getByText(/Total matching registrations/i)).toBeVisible();
});
