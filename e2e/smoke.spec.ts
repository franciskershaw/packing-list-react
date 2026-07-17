import { expect, test } from "@playwright/test";

test("app shell renders with primary nav", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "Trips" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Templates" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Library" })).toBeVisible();
});
