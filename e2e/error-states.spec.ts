import { expect, test, type Page } from "@playwright/test";

const fillRegistrationForm = async (page: Page) => {
  const suffix = Date.now();
  await page.getByLabel("Full Name").fill(`Error Flow User ${suffix}`);
  await page.getByLabel("Age").fill("25");
  await page.getByLabel("Contact Number").fill(`+20 100 ${String(suffix).slice(-6)}`);
  await page.getByLabel("Email (optional)").fill(`error.flow.${suffix}@example.com`);
};

test("shows actionable failure when API is unreachable", async ({ page }) => {
  await page.route("**/api/camps", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/");
  await expect(page.getByText(/Operation Failed/i)).toBeVisible();
  await expect(page.getByText(/What happened:/i)).toBeVisible();
  await expect(page.getByText(/What to do now:/i)).toBeVisible();
});

test("redirects unauthenticated user from protected admin route", async ({ page }) => {
  await page.goto("/admin/registrations");
  await expect(page.getByRole("heading", { name: /Admin Login/i })).toBeVisible();
});

test("maps 400 validation response to field-level errors", async ({ page }) => {
  await page.goto("/register");
  await fillRegistrationForm(page);

  await page.route("**/api/registrations", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      headers: {
        "x-request-id": "req-val-400"
      },
      body: JSON.stringify({
        message: "Validation failed",
        errorCode: "VALIDATION_ERROR",
        details: ["Age must be greater than 0"],
        fieldErrors: {
          age: ["Age must be greater than 0"]
        }
      })
    });
  });

  await page.getByRole("button", { name: "Submit Registration" }).click();
  await expect(page.locator(".field-error-text", { hasText: "Age must be greater than 0" })).toBeVisible();
  const validationRequestId = page
    .locator(".error-card p", { has: page.locator("strong", { hasText: "Request ID:" }) })
    .first();
  await expect(validationRequestId).toContainText("req-val-400");
});

test("shows 409 conflict diagnostics with request id", async ({ page }) => {
  await page.goto("/register");
  await fillRegistrationForm(page);

  await page.route("**/api/registrations", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      headers: {
        "x-request-id": "req-conflict-409"
      },
      body: JSON.stringify({
        message: "Duplicate registration detected for this contact number and camp",
        errorCode: "CONFLICT"
      })
    });
  });

  await page.getByRole("button", { name: "Submit Registration" }).click();
  await expect(page.getByText(/Duplicate registration detected/i)).toBeVisible();
  const conflictRequestId = page
    .locator(".error-card p", { has: page.locator("strong", { hasText: "Request ID:" }) })
    .first();
  await expect(conflictRequestId).toContainText("req-conflict-409");
});

test("shows retry action with cooldown for rate limiting", async ({ page }) => {
  await page.goto("/register");
  await fillRegistrationForm(page);

  await page.route("**/api/registrations", async (route) => {
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      headers: {
        "x-request-id": "req-rate-429"
      },
      body: JSON.stringify({
        message: "Too many requests",
        errorCode: "RATE_LIMITED"
      })
    });
  });

  await page.getByRole("button", { name: "Submit Registration" }).click();
  const rateLimitRequestId = page
    .locator(".error-card p", { has: page.locator("strong", { hasText: "Request ID:" }) })
    .first();
  await expect(rateLimitRequestId).toContainText("req-rate-429");

  const retryButton = page.getByRole("button", { name: "Retry" });
  await expect(retryButton).toBeVisible();
  await retryButton.click();
  await expect(page.getByRole("heading", { name: "Camp Registration" })).toBeVisible();
});
