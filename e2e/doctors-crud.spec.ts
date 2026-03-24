import { expect, test } from "@playwright/test";

test("admin can create update and delete a doctor from UI", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin12345");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: /Admin Registrations/i })).toBeVisible();

  await page.goto("/admin/doctors");
  await expect(page.getByRole("heading", { name: /Doctors Management/i })).toBeVisible();

  const suffix = Date.now();
  const doctorName = `PW Doctor ${suffix}`;

  await page.getByLabel("Full Name").fill(doctorName);
  await page.getByLabel("Email").fill(`pw.doctor.${suffix}@example.com`);
  await page.getByLabel("Contact Number").fill(`+20 102 ${String(suffix).slice(-6)}`);
  await page.getByLabel("Specialization").fill("Dermatology");
  await page.getByLabel("Department").fill("Outpatient");
  await page.getByRole("button", { name: "Create Doctor" }).click();

  await expect(page.getByText(/Doctor created successfully/i)).toBeVisible();
  const row = page.locator("tr", { hasText: doctorName });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Specialization").fill("Internal Medicine");
  await page.getByRole("button", { name: "Update Doctor" }).click();
  await expect(page.getByText(/Doctor updated successfully/i)).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(/Doctor deleted successfully/i)).toBeVisible();
  await expect(row).toHaveCount(0);
});
