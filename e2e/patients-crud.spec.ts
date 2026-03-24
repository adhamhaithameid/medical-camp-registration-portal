import { expect, test } from "@playwright/test";

test("admin can create update and delete a patient from UI", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin12345");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: /Admin Registrations/i })).toBeVisible();

  await page.goto("/admin/patients");
  await expect(page.getByRole("heading", { name: /Patients Management/i })).toBeVisible();

  const suffix = Date.now();
  const patientName = `PW Patient ${suffix}`;

  await page.getByLabel("Full Name").fill(patientName);
  await page.getByLabel("Date of Birth").fill("1994-07-18");
  await page.getByLabel("Gender").fill("Female");
  await page.getByLabel("Contact Number").fill(`+20 101 ${String(suffix).slice(-6)}`);
  await page.getByLabel("Email").fill(`pw.patient.${suffix}@example.com`);
  await page.getByLabel("Address").fill("Nasr City, Cairo");
  await page.getByLabel("Medical History").fill("Allergy");
  await page.getByRole("button", { name: "Create Patient" }).click();

  await expect(page.getByText(/Patient created successfully/i)).toBeVisible();
  const row = page.locator("tr", { hasText: patientName });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Address").fill("Heliopolis, Cairo");
  await page.getByRole("button", { name: "Update Patient" }).click();
  await expect(page.getByText(/Patient updated successfully/i)).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(/Patient deleted successfully/i)).toBeVisible();
  await expect(row).toHaveCount(0);
});
