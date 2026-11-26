import { Locator, Page, expect } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  async expectUrlToContain(fragment: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(fragment));
  }

  async waitForAppIdle(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  protected async textOf(locator: Locator): Promise<string> {
    return (await locator.innerText()).replace(/\s+/g, ' ').trim();
  }
}
