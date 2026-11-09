import { expect, retype, test, untilReady } from '../fixtures';

test.describe('create a routine', () => {
    test.beforeEach(async ({ page, user }) => {
        await page.goto('/routines');
        await expect(
            page.getByRole('heading', { name: 'Routines' })
        ).toBeVisible();
        await expect(page.getByRole('button', { name: 'Menu' })).toContainText(
            user.name
        );
        // Every test starts from a hydrated, empty form.
        const form = page.locator('form').filter({ hasText: 'New routine' });
        const name = form.getByRole('textbox', { name: 'Name' });
        const weeks = form.getByRole('spinbutton', {
            name: 'Duration in weeks',
        });
        await untilReady(
            async () => {
                await retype(name, 'x');
                await retype(weeks, '1');
            },
            form.getByRole('button', { name: 'Create routine' })
        );
        await name.fill('');
        await weeks.fill('');
    });

    test('starts empty, with nothing to show', async ({ page }) => {
        await expect(page.getByText('You have no routines yet.')).toBeVisible();
        // No requests waiting, so no tab for them.
        await expect(page.getByRole('link', { name: /^Requests/ })).toHaveCount(
            0
        );
    });

    test('the button waits for a name and a valid duration', async ({
        page,
    }) => {
        const form = page.locator('form').filter({ hasText: 'New routine' });
        const name = form.getByRole('textbox', { name: 'Name' });
        const weeks = form.getByRole('spinbutton', {
            name: 'Duration in weeks',
        });
        const create = form.getByRole('button', { name: 'Create routine' });

        await expect(create).toBeDisabled();
        await name.fill('Strength block');
        await expect(create).toBeDisabled();

        for (const outOfRange of ['0', '53']) {
            await weeks.fill(outOfRange);
            await expect(create).toBeDisabled();
        }
        await weeks.fill('8');
        await expect(create).toBeEnabled();

        // Blank names do not count.
        await name.fill('   ');
        await expect(create).toBeDisabled();
    });

    test('a fixed-length routine opens on its own page and is listed', async ({
        page,
    }) => {
        const form = page.locator('form').filter({ hasText: 'New routine' });
        await form
            .getByRole('textbox', { name: 'Name' })
            .fill('Strength block');
        await form
            .getByRole('spinbutton', { name: 'Duration in weeks' })
            .fill('8');
        await form.getByRole('button', { name: 'Create routine' }).click();

        await expect(page).toHaveURL(/\/routines\/[\w-]+$/);
        await expect(
            page.getByRole('heading', { level: 1, name: 'Strength block' })
        ).toBeVisible();
        await expect(page.getByText('8 weeks · 0 days per week')).toBeVisible();
        await expect(page.getByText('This routine is empty')).toBeVisible();

        await page.goto('/routines');
        const card = page.getByRole('link', { name: /Strength block/ });
        await expect(card).toContainText('8 weeks · 0 days');
        await expect(card).toContainText('Incomplete');
    });

    test('an open-ended routine takes no duration', async ({ page }) => {
        const form = page.locator('form').filter({ hasText: 'New routine' });
        const weeks = form.getByRole('spinbutton', {
            name: 'Duration in weeks',
        });
        await form.getByRole('textbox', { name: 'Name' }).fill('Forever');
        await form.getByRole('button', { name: 'Open-ended' }).click();

        await expect(weeks).toBeDisabled();
        await form.getByRole('button', { name: 'Create routine' }).click();
        await expect(
            page.getByText('Open-ended · 0 days per week')
        ).toBeVisible();
    });
});
