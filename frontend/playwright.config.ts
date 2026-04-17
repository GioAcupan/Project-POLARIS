import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "python -m uvicorn api.main:app --host 127.0.0.1 --port 8000",
      url: "http://127.0.0.1:8000/health",
      cwd: "..",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173",
      url: "http://127.0.0.1:5173",
      cwd: ".",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
