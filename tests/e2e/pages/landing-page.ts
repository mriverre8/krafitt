import type { Locator, Page } from '@playwright/test';

/** The signed-out home page: hero, landing sections and the sign-in form. */
export class LandingPage {
    readonly hero: Locator;
    readonly startCta: Locator;
    readonly tourCta: Locator;
    readonly settingsButton: Locator;
    readonly join: Locator;
    readonly loginTab: Locator;
    readonly signupTab: Locator;
    readonly name: Locator;
    readonly email: Locator;
    readonly password: Locator;
    readonly submit: Locator;

    constructor(readonly page: Page) {
        // The wordmark is two styled spans: browsers disagree on whether its
        // accessible name has a space in the middle.
        this.hero = page.getByRole('heading', {
            level: 1,
            name: /^Kra ?fitt$/,
        });
        this.startCta = page.getByRole('link', { name: 'Start training' });
        this.tourCta = page.getByRole('link', { name: 'See how it works' });
        this.settingsButton = page.getByRole('button', { name: 'Settings' });

        this.join = page.getByRole('region', {
            name: 'Write your first routine',
        });
        this.loginTab = this.join.getByRole('button', { name: 'Sign in' });
        this.signupTab = this.join.getByRole('button', { name: 'Sign up' });
        this.name = this.join.getByLabel('Name');
        this.email = this.join.getByLabel('Email');
        this.password = this.join.getByLabel('Password');
        this.submit = this.join.locator('button[type="submit"]');
    }

    async goto() {
        await this.page.goto('/');
    }

    async signIn(email: string, password: string) {
        await this.loginTab.click();
        await this.email.fill(email);
        await this.password.fill(password);
        await this.submit.click();
    }
}
