import { test, expect } from "@playwright/test";

test.describe("Authentication & Profile User Journey", () => {
  test("User can register, login, and verify JWT persistence", async ({
    page,
  }) => {
    // 1. Generate unique email
    const uniqueId = Date.now();
    const email = `testuser_${uniqueId}@example.com`;
    const password = "Password123!";
    const username = `TestPlayer${uniqueId}`;

    // 2. Navigate to Auth Page
    await page.goto("/fr/auth");

    // 3. Switch to Register Mode (bottom link)
    await page.locator('button:has-text("Créer un Compte")').first().click();

    // 4. Fill Register Form
    await page.fill('input[placeholder="Nom d\'utilisateur"]', username);
    await page.fill('input[placeholder="Adresse e-mail"]', email);
    await page.fill('input[placeholder="Mot de passe"]', password);

    // Wait for response and click submit
    const responsePromise = page.waitForResponse((response) =>
      response.url().includes("/auth/register"),
    );

    // Using the main submit button
    await page.locator("form button").first().click();

    const response = await responsePromise;
    expect(response.status()).toBe(201);

    // 5. Verify redirection to profile page
    await page.waitForURL("**/profile");

    // Check if username is displayed
    await expect(page.locator("h1")).toContainText(username);

    // 6. Test Logout
    await page.click('button:has-text("Se déconnecter")');

    // Wait to be redirected to home or login
    await page.waitForURL("**/");

    // 7. Test Login
    await page.goto("/fr/auth");
    await page.fill('input[placeholder="Adresse e-mail"]', email);
    await page.fill('input[placeholder="Mot de passe"]', password);

    const loginResponsePromise = page.waitForResponse((response) =>
      response.url().includes("/auth/login"),
    );
    await page.locator("form button").first().click();

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(201); // NestJS POST returns 201 by default unless overriden

    // 8. Verify redirection again
    await page.waitForURL("**/profile");

    // 9. JWT Persistence check - refresh the page and verify user is still logged in
    await page.reload();
    await expect(page.locator("h1")).toContainText(username);
  });
});
