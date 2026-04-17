import { expect, test } from "@playwright/test"

test("frontend app shell loads", async ({ page }) => {
  await page.goto("/")

  await expect(page.locator("body")).toBeVisible()
  await expect(page).toHaveTitle(/.+/)
})

test("backend health endpoint responds", async ({ request }) => {
  const response = await request.get("http://127.0.0.1:8000/health")

  expect(response.ok()).toBeTruthy()
  const payload = await response.json()
  expect(payload).toHaveProperty("status")
})

test("user can navigate to report generator", async ({ page }) => {
  await page.goto("/")

  await page.getByTitle("Report Generator").click()
  await expect(page).toHaveURL(/\/reports$/)
  await expect(page.getByRole("heading", { name: "REPORT GENERATOR" })).toBeVisible()
})
