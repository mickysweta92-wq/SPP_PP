import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { HlProgress, MonthlyGoal, RewardPrice, parseHlProgress, parseMonthlyGoal, parseNumber } from '../utils/parsers';

export interface FeaturedReward {
  name: string;
  hasViewDetails: boolean;
  price: RewardPrice | null;
}

export class DashboardPage extends BasePage {
  // Layout / header
  readonly pageTitle: Locator;
  readonly headerPointsLink: Locator;
  readonly headerCartLink: Locator;
  readonly cartBadge: Locator;
  readonly logoutButton: Locator;
  readonly sidebar: Locator;

  // Hero / points summary
  readonly bannerHeading: Locator;
  readonly tierName: Locator;
  readonly welcomeMessage: Locator;
  readonly starPoints: Locator;
  readonly expiringStarPoints: Locator;
  readonly viewTransactionsButton: Locator;

  // Star achievements
  readonly achievementsCard: Locator;
  readonly achievementsHlBadge: Locator;
  readonly tierTitles: Locator;
  readonly achievedTierNodes: Locator;
  readonly viewStarLevelBenefitsLink: Locator;

  // Monthly goals
  readonly monthlyGoalsCard: Locator;
  readonly monthlyGoalItems: Locator;
  readonly monthlyGoalCallout: Locator;

  // Featured rewards
  readonly featuredRewardsCard: Locator;
  readonly rewardItems: Locator;

  constructor(page: Page) {
    super(page);
    this.pageTitle = page.getByRole('heading', { name: 'Home', level: 5 });
    this.headerPointsLink = page.locator('a.btn[href="/mytransaction"]').filter({ has: page.locator('.ri-star-fill') });
    this.headerCartLink = page.locator('a[href="/cart"]:has(.count-mail)');
    this.cartBadge = this.headerCartLink.locator('.count-mail');
    this.logoutButton = page.locator('.logout-btn');
    this.sidebar = page.getByRole('navigation').filter({ has: page.getByRole('link', { name: 'Star Partnership Home' }) });

    this.bannerHeading = page.getByRole('heading', { name: 'Star Partnership', level: 1 });
    this.tierName = page.getByRole('heading', { level: 2 });
    this.welcomeMessage = page.getByRole('heading', { name: 'Welcome to Star Partnership', level: 4 });
    this.starPoints = page.locator('.points-value').nth(0);
    this.expiringStarPoints = page.locator('.points-value').nth(1);
    this.viewTransactionsButton = page.getByRole('link', { name: 'View Transactions' });

    this.achievementsCard = this.cardWithHeading('Star Achievements');
    this.achievementsHlBadge = this.achievementsCard.getByText(/[\d,]+\s*HL\s*\/\s*[\d,]+\s*HL/);
    this.tierTitles = this.achievementsCard.locator('.sa-tier-title');
    this.achievedTierNodes = this.achievementsCard.locator('.sa-node.achieved');
    this.viewStarLevelBenefitsLink = page.getByRole('link', { name: 'View Star Level Benefits' });

    this.monthlyGoalsCard = this.cardWithHeading('Monthly Goals');
    this.monthlyGoalItems = this.monthlyGoalsCard.locator('.month-item');
    this.monthlyGoalCallout = this.monthlyGoalsCard.locator('.milestone-callout-box');

    this.featuredRewardsCard = this.cardWithHeading('Featured Rewards');
    // slick clones the slides for infinite scrolling; ignore the clones
    this.rewardItems = this.featuredRewardsCard.locator('.rewards-item:not(.slick-cloned)');
  }

  private cardWithHeading(heading: string): Locator {
    return this.page.locator('.iq-card').filter({ has: this.page.getByRole('heading', { name: heading, level: 4 }) }).last();
  }

  async open(): Promise<void> {
    await this.goto('/dashboard');
    await this.waitUntilLoaded();
  }

  async waitUntilLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await expect(this.bannerHeading).toBeVisible();
    await expect(this.tierName).toBeVisible();
    await expect(this.starPoints).toHaveText(/\d/);
    await expect(this.headerPointsLink).toHaveText(/\d/);
    await expect(this.rewardItems.first()).toBeAttached();
    await expect(this.monthlyGoalItems).toHaveCount(12);
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  async clickSidebarLink(name: string): Promise<void> {
    await this.sidebar.getByRole('link', { name }).first().click();
  }

  // ---- Data readers ----

  async getHeaderPoints(): Promise<number> {
    return parseNumber(await this.textOf(this.headerPointsLink));
  }

  async getCartCount(): Promise<number> {
    return parseNumber(await this.textOf(this.cartBadge));
  }

  async getTierName(): Promise<string> {
    return this.textOf(this.tierName);
  }

  async getStarPoints(): Promise<number> {
    return parseNumber(await this.textOf(this.starPoints));
  }

  async getExpiringStarPoints(): Promise<number> {
    return parseNumber(await this.textOf(this.expiringStarPoints));
  }

  async getHlProgress(): Promise<HlProgress> {
    return parseHlProgress(await this.textOf(this.achievementsHlBadge));
  }

  async getTierTitles(): Promise<string[]> {
    return (await this.tierTitles.allInnerTexts()).map((t) => t.trim());
  }

  async getMonthlyGoals(): Promise<MonthlyGoal[]> {
    const items = this.monthlyGoalItems;
    const count = await items.count();
    const goals: MonthlyGoal[] = [];
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const goal = parseMonthlyGoal(await this.textOf(item));
      const classes = (await item.locator('.month-dot').getAttribute('class')) ?? '';
      goal.status = classes.includes('is-achieved') ? 'achieved' : classes.includes('is-missed') ? 'missed' : 'pending';
      goals.push(goal);
    }
    return goals;
  }

  /** Callout above the timeline, e.g. { remainingHl: 790, text: "by 30 November 2026 to unlock bonus reward of 900 Star Points" } */
  async getMonthlyGoalCallout(): Promise<{ remainingHl: number; text: string }> {
    const remainingHl = parseNumber(await this.textOf(this.monthlyGoalCallout.locator('.milestone-callout-delta')));
    const text = await this.textOf(this.monthlyGoalCallout.locator('.milestone-callout-text'));
    return { remainingHl, text };
  }

  async getFeaturedRewards(): Promise<FeaturedReward[]> {
    // Read everything in a single DOM pass: the carousel autoplays and re-renders slides,
    // so per-element locator reads can hit detached nodes.
    const rows = await this.rewardItems.evaluateAll((items) =>
      items.map((item) => {
        const text = (selector: string) => item.querySelector(selector)?.textContent?.trim() ?? null;
        return {
          name: item.querySelector('img.card-img-top')?.getAttribute('alt') ?? '',
          hasViewDetails: [...item.querySelectorAll('a')].some((a) => a.textContent?.includes('View Details')),
          original: text('span.text-muted'),
          discount: text('.badge.bg-warning'),
          discounted: text('.badge-success'),
        };
      }),
    );
    return rows.map((row) => ({
      name: row.name,
      hasViewDetails: row.hasViewDetails,
      price:
        row.original && row.discounted
          ? {
              original: parseNumber(row.original),
              discountPercent: row.discount ? Math.abs(parseNumber(row.discount)) : 0,
              discounted: parseNumber(row.discounted),
            }
          : null,
    }));
  }
}
