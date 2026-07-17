import { expect, test } from "@playwright/test";

import { requireApi } from "./require-api.js";

test.beforeAll(requireApi);

test("redirects to /login when there is no session", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page).toHaveURL("/login");
});
