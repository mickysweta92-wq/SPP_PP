import { test, expect } from '../../src/fixtures/test-fixtures';
import { env } from '../../src/config/env';
import { invalidLogins, loginMessages } from '../../src/test-data/login.data';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
  });

  test('login page shows all expected elements @smoke', async ({ loginPage, page }) => {
    await expect(loginPage.heading).toBeVisible();
    await expect(page.getByText('Enter your email address and password to access admin panel.')).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
    await expect(loginPage.signInButton).toBeEnabled();
  });

  test('password field is masked', async ({ loginPage }) => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('valid credentials land on the dashboard @smoke', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(env.email, env.password);
    await expect(page).toHaveURL(/\/dashboard/);
    await dashboardPage.waitUntilLoaded();
    await expect(dashboardPage.pageTitle).toBeVisible();
  });

  test('submitting empty form shows a required-field message', async ({ loginPage, page }) => {
    await loginPage.signInButton.click();
    await loginPage.expectValidationMessage(loginMessages.emailRequired);
    await expect(page).toHaveURL(/\/signIn/);
  });

  test('invalid credentials are rejected', async ({ loginPage, page }) => {
    await loginPage.login(invalidLogins.unknownUser.email, invalidLogins.unknownUser.password);
    await loginPage.expectValidationMessage(loginMessages.invalidPassword);
    await expect(page).toHaveURL(/\/signIn/);
  });

  test('valid email with wrong password is rejected', async ({ loginPage, page }) => {
    await loginPage.login(env.email, 'Wrong@12345');
    await loginPage.expectValidationMessage(loginMessages.invalidPassword);
    await expect(page).toHaveURL(/\/signIn/);
  });

  test('remember me checkbox can be toggled', async ({ loginPage }) => {
    await loginPage.setRememberMe(true);
    await expect(loginPage.rememberMeCheckbox).toBeChecked();
    await loginPage.setRememberMe(false);
    await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
  });

  test('logout returns the user to the sign-in page', async ({ loginPage, dashboardPage, page }) => {
    await loginPage.login(env.email, env.password);
    await dashboardPage.waitUntilLoaded();
    await dashboardPage.logout();
    await expect(page).toHaveURL(/\/signIn/);
    await expect(loginPage.heading).toBeVisible();
  });

  test('dashboard is not accessible without logging in', async ({ page, loginPage }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/signIn/);
    await expect(loginPage.heading).toBeVisible();
  });
});
