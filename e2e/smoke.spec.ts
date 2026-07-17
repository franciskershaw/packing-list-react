import { expect, test } from "@playwright/test";

// Updated in PACKFE-003: "/" now redirects through ProtectedRoute, so an
// unauthenticated visitor lands on /login, not the nav shell directly.
// This still proves the app boots and real routing/auth-gating works
// end to end — it just asserts a different (now correct) outcome than
// PACKFE-001's original version of this test.
test("unauthenticated visitor is redirected to the login screen", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL("/login");
  await expect(
    page.getByRole("link", { name: "Continue with Google" }),
  ).toBeVisible();
});
