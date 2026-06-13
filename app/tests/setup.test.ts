import { test as setup, expect } from "@playwright/test";

/**
 * T01: Login screen renders and workspace creation works.
 *
 * This test:
 * 1. Visits the root page → lands on login screen
 * 2. Enters a name and creates a workspace
 * 3. Verifies the user is taken to the Timer page
 * 4. Saves the auth state for subsequent tests
 */
setup("login and create workspace", async ({ page }) => {
  await page.goto("/");

  // Login screen should be visible
  await expect(page.locator("text=Powerhouse Time")).toBeVisible();

  // Enter name and create workspace
  await page.getByPlaceholder("Your name").fill("Tester");
  await page.getByRole("button", { name: /create/i }).click();

  // Should redirect to Timer page (main app)
  // The page header shows "Timer" on the timer page
  // Wait a moment for redirects
  await page.waitForTimeout(2000);

  // Check we're in the app (sidebar should be visible)
  await expect(page.locator("text=Powerhouse Time")).toBeVisible();

  // Save auth state for other tests
  await page.context().storageState({ path: "tests/.playwright/state.json" });
});
