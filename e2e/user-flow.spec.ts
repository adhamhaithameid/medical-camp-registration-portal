import { test, expect } from "@playwright/test";

test("user can submit registration end-to-end", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Registration" }).click();

  await page.getByLabel("Full Name").fill("Playwright User");
  await page.getByLabel("Age").fill("29");
  await page.getByLabel("Contact Number").fill("+20 100 111 2233");

  const campSelect = page.getByLabel("Camp Selection");
  await campSelect.selectOption({ index: 1 });

  await page.getByRole("button", { name: "Submit Registration" }).click();

  await expect(page.getByText(/Registration submitted successfully/i)).toBeVisible();
});
