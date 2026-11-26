import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly signInButton: Locator;
  readonly validationMessages: Locator;




  
  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Sign in', level: 1 });
    this.emailInput = page.getByPlaceholder('Enter email');
    this.passwordInput = page.getByLabel('Password');
    this.rememberMeCheckbox = page.getByRole('checkbox', { name: 'Remember Me' });
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.validationMessages = page.locator('.text-danger');
  }

  async open(): Promise<void> {
    await this.goto('/signIn');
    await expect(this.heading).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async setRememberMe(checked: boolean): Promise<void> {
    // the native input is visually hidden by the theme, so click its label
    if ((await this.rememberMeCheckbox.isChecked()) !== checked) {
      await this.page.getByText('Remember Me').click();
    }
  }

  async expectValidationMessage(message: string | RegExp): Promise<void> {
    await expect(this.validationMessages.filter({ hasText: message }).first()).toBeVisible();
  }
}
