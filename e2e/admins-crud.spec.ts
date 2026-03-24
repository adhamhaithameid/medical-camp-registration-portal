import { expect, test } from "@playwright/test";

test("super admin can create update and delete another admin from UI", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin12345");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: /Admin Registrations/i })).toBeVisible();

  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: /Admins Management/i })).toBeVisible();

  const suffix = Date.now();
  const username = `pw.staff.${suffix}`;

  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("staff12345");
  await page.getByLabel("Role").selectOption("STAFF");
  await page.getByRole("button", { name: "Create Admin" }).click();

  await expect(page.getByText(/Admin user created successfully/i)).toBeVisible();
  const row = page.locator("tr", { hasText: username });
  await expect(row).toBeVisible();
  await expect(row).toContainText("STAFF");

  await row.getByRole("button", { name: "Toggle Role" }).click();
  await expect(page.getByText(/Admin role updated/i)).toBeVisible();
  await expect(row).toContainText("SUPER_ADMIN");

  await row.getByRole("button", { name: "Toggle Role" }).click();
  await expect(page.getByText(/Admin role updated/i)).toBeVisible();
  await expect(row).toContainText("STAFF");

  await row.getByRole("button", { name: "Toggle Active" }).click();
  await expect(page.getByText(/Admin active status updated/i)).toBeVisible();
  await expect(row).toContainText("Inactive");

  await row.getByRole("button", { name: "Toggle Active" }).click();
  await expect(page.getByText(/Admin active status updated/i)).toBeVisible();
  await expect(row).toContainText("Active");

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(/Admin user deleted/i)).toBeVisible();
  await expect(row).toHaveCount(0);
});
