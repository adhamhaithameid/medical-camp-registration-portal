import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry"
  },
  webServer: [
    {
      command: "pnpm db:deploy && pnpm db:seed && pnpm --filter server start:e2e",
      port: 4000,
      timeout: 180_000,
      reuseExistingServer: false
    },
    {
      command: "pnpm --filter client dev",
      port: 5173,
      timeout: 180_000,
      reuseExistingServer: false
    }
  ]
});
