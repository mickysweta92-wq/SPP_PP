import { test, expect } from '../../src/fixtures/test-fixtures';
import expected from '../../src/test-data/dashboard.expected.json';
import { formatLongDate } from '../../src/utils/parsers';

test.describe('Dashboard - data validation', () => {
  test.beforeEach(async ({ authenticatedDashboard }) => {
    await authenticatedDashboard.waitUntilLoaded();
  });

  test.describe('page layout', () => {
    test('shows header, banner and welcome content @smoke', async ({ dashboardPage }) => {
      await expect(dashboardPage.pageTitle).toBeVisible();
      await expect(dashboardPage.bannerHeading).toBeVisible();
      await expect(dashboardPage.welcomeMessage).toHaveText(expected.user.welcomeMessage);
      await expect(dashboardPage.logoutButton).toBeVisible();
    });

    test('sidebar menu has the expected links', async ({ dashboardPage }) => {
      for (const item of expected.sidebar) {
        await expect(dashboardPage.sidebar.getByRole('link', { name: item.name })).toHaveAttribute('href', item.href);
      }
    });
  });

  test.describe('star points', () => {
    test('tier name matches the user profile @smoke', async ({ dashboardPage }) => {
      expect(await dashboardPage.getTierName()).toBe(expected.user.tier);
    });

    test('star points and expiring points match expected data @smoke', async ({ dashboardPage }) => {
      expect(await dashboardPage.getStarPoints()).toBe(expected.user.starPoints);
      expect(await dashboardPage.getExpiringStarPoints()).toBe(expected.user.expiringStarPoints);
    });

    test('header points balance equals the dashboard star points', async ({ dashboardPage }) => {
      expect(await dashboardPage.getHeaderPoints()).toBe(await dashboardPage.getStarPoints());
    });

    test('points are shown "as of" today', async ({ page }) => {
      await expect(page.getByText(`as of ${formatLongDate(new Date())}`).first()).toBeVisible();
    });

    test('cart count matches expected data', async ({ dashboardPage }) => {
      expect(await dashboardPage.getCartCount()).toBe(expected.user.cartCount);
    });

    test('View Transactions navigates to My Star Points', async ({ dashboardPage, page }) => {
      await dashboardPage.viewTransactionsButton.click();
      await expect(page).toHaveURL(/\/mytransaction/);
    });
  });

  test.describe('star achievements', () => {
    test('shows all tiers in order', async ({ dashboardPage }) => {
      expect(await dashboardPage.getTierTitles()).toEqual(expected.achievements.tiers);
    });

    test('achieved tier nodes match expected data', async ({ dashboardPage }) => {
      await expect(dashboardPage.achievedTierNodes).toHaveCount(expected.achievements.achievedTierCount);
    });

    test('HL progress matches expected data', async ({ dashboardPage }) => {
      expect(await dashboardPage.getHlProgress()).toEqual(expected.achievements.hl);
    });

    test('View Star Level Benefits navigates to About page', async ({ dashboardPage, page }) => {
      await dashboardPage.viewStarLevelBenefitsLink.click();
      await expect(page).toHaveURL(/\/about-us/);
    });
  });

  test.describe('monthly goals', () => {
    test('lists 12 months with the expected HL targets @smoke', async ({ dashboardPage }) => {
      const goals = await dashboardPage.getMonthlyGoals();
      expect(goals.map(({ month, hl }) => ({ month, hl }))).toEqual(expected.monthlyGoals);
    });

    test('every month has a status; only the future months are pending', async ({ dashboardPage }) => {
      const goals = await dashboardPage.getMonthlyGoals();
      const currentMonth = new Date().getMonth(); // 0-based
      goals.forEach((goal, index) => {
        if (index < currentMonth) {
          expect(['achieved', 'missed'], `${goal.month} status`).toContain(goal.status);
        } else {
          expect(goal.status, `${goal.month} status`).toBe('pending');
        }
      });
    });

    test('callout shows the current month target and the bonus reward', async ({ dashboardPage }) => {
      const callout = await dashboardPage.getMonthlyGoalCallout();
      const goals = await dashboardPage.getMonthlyGoals();
      const current = goals[new Date().getMonth()];
      expect(callout.remainingHl).toBeLessThanOrEqual(current.hl);
      expect(callout.text).toMatch(/by \d{1,2} \w+ \d{4} to unlock\s+bonus reward of \d[\d,]* Star Points/);
    });
  });

  test.describe('featured rewards', () => {
    test('shows the expected rewards', async ({ dashboardPage }) => {
      // order is not asserted: the carousel rotates its slides
      const rewards = await dashboardPage.getFeaturedRewards();
      expect(rewards.map((r) => r.name).sort()).toEqual([...expected.featuredRewards].sort());
    });

    test('every reward has a valid, discounted price', async ({ dashboardPage }) => {
      for (const { name, price } of await dashboardPage.getFeaturedRewards()) {
        expect(price, `${name} should have a price`).not.toBeNull();
        const { original, discountPercent, discounted } = price!;
        const expectedDiscounted = original * (1 - discountPercent / 100);
        expect(discounted, `${name} discounted price`).toBeLessThan(original);
        // the app rounds down; allow 1 point for rounding differences
        expect(Math.abs(discounted - expectedDiscounted), `${name} discount maths`).toBeLessThan(1);
      }
    });
  });
});
