import { expect, type Locator, type Page } from '@playwright/test';

/** The home screen of a signed-in user: the day owed today, and its logging. */
export class TodayPage {
    readonly day: Locator;
    readonly start: Locator;
    readonly finish: Locator;
    readonly dialog: Locator;

    constructor(readonly page: Page) {
        this.day = page.getByRole('heading', { level: 1 });
        this.start = page.getByRole('button', { name: /^(Start|Continue)/ });
        this.finish = page.getByRole('button', { name: 'Finish workout' });
        this.dialog = page.getByRole('dialog');
    }

    async goto() {
        await this.page.goto('/');
    }

    /** One exercise's card, by its name. */
    exercise(name: string) {
        return this.page.locator('section').filter({
            has: this.page.getByRole('heading', { name, exact: true }),
        });
    }

    /** Types a set in and banks it, effort left as planned. */
    async logSet(exercise: string, set: number, weight: string, reps: string) {
        const card = this.exercise(exercise);
        await card
            .getByRole('textbox', { name: `Weight set ${set}` })
            .fill(weight);
        await card.getByRole('textbox', { name: `Reps set ${set}` }).fill(reps);
        await card.getByRole('button', { name: `Save set ${set}` }).click();
        await expect(
            card.getByRole('radiogroup', { name: `How set ${set} felt` })
        ).toBeVisible();
        await card.getByRole('button', { name: `Bank set ${set}` }).click();
        await expect(
            card.getByRole('button', { name: `Save set ${set}` })
        ).toHaveAttribute('data-done', 'true');
    }

    async confirm(label: string) {
        await this.dialog
            .getByRole('button', { name: label, exact: true })
            .click();
        await expect(this.dialog).toBeHidden();
    }
}
