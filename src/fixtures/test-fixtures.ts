import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { env } from '../config/env';

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  /** A dashboard page that is already authenticated and fully loaded. */
  authenticatedDashboard: DashboardPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  authenticatedDashboard: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.login(env.email, env.password);
    const dashboard = new DashboardPage(page);
    await dashboard.waitUntilLoaded();
    await use(dashboard);
  },
});

export { expect } from '@playwright/test';
