import { expect, type Locator, type Page } from '@playwright/test';

/**
 * A routine's or a workout's own page: the options menu, edit mode and the
 * day editor. Both kinds share every one of these, worded the same.
 */
export class RoutinePage {
    readonly heading: Locator;
    readonly options: Locator;
    readonly done: Locator;
    readonly saveChanges: Locator;
    readonly dialog: Locator;

    constructor(readonly page: Page) {
        this.heading = page.getByRole('heading', { level: 1 });
        this.options = page.getByRole('button', { name: 'Options' });
        this.done = page.getByRole('button', { name: 'Done' });
        this.saveChanges = page.getByRole('button', { name: 'Save changes' });
        this.dialog = page.getByRole('dialog');
    }

    async goto(id: string, section: 'routines' | 'workouts' = 'routines') {
        await this.page.goto(`/${section}/${id}`);
    }

    /** Opens the options menu and picks an entry (a button or a link). */
    async menu(name: string | RegExp) {
        await this.options.click();
        await this.page
            .getByRole('button', { name, exact: typeof name === 'string' })
            .or(this.page.getByRole('link', { name }))
            .click();
    }

    /** A menu entry, for checking what the menu offers. Open it first. */
    entry(name: string) {
        return this.page
            .getByRole('button', { name, exact: true })
            .or(this.page.getByRole('link', { name, exact: true }));
    }

    async edit() {
        await this.menu('Edit');
        await expect(this.done).toBeVisible();
    }

    /** Confirms the open confirm dialog with the given button. */
    async confirm(label: string) {
        await this.dialog
            .getByRole('button', { name: label, exact: true })
            .click();
        await expect(this.dialog).toBeHidden();
    }

    /** Adds a day from edit mode through the "Add day" dialog. */
    async addDay(name: string) {
        await this.page
            .getByRole('button', { name: 'Add day' })
            .first()
            .click();
        const dialog = this.page.getByRole('dialog', { name: 'Add day' });
        await dialog.getByRole('textbox', { name: 'Day name' }).fill(name);
        await dialog.getByRole('button', { name: 'Add' }).click();
        await expect(dialog).toBeHidden();
    }

    /** The day on screen: a routine's tab panel, or a workout's one day. */
    get dayPanel() {
        return this.page.url().includes('/workouts/')
            ? this.page.getByRole('main')
            : this.page.getByRole('tabpanel').filter({ visible: true });
    }

    exerciseName(n: number) {
        return this.dayPanel.getByRole('combobox', {
            name: `Exercise ${n} name`,
        });
    }

    /** Fills the first set of exercise `n` as a rep range. */
    async fillRange(n: number, set: number | string, min: number, max: number) {
        await this.dayPanel
            .getByRole('textbox', {
                name: `Exercise ${n}, min reps set ${set}`,
            })
            .fill(String(min));
        await this.dayPanel
            .getByRole('textbox', {
                name: `Exercise ${n}, max reps set ${set}`,
            })
            .fill(String(max));
    }

    async save() {
        await this.saveChanges.click();
        await expect(this.saveChanges).toBeHidden();
    }
}
