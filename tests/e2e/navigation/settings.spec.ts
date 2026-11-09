import { expect, test } from '../fixtures';

test.describe('settings modal (signed out)', () => {
    test('opens and closes', async ({ landing, page }) => {
        await landing.settingsButton.click();
        const dialog = page.getByRole('dialog', { name: 'Settings' });
        await expect(dialog).toBeVisible();

        await dialog.getByRole('button', { name: 'Close' }).click();
        await expect(dialog).toBeHidden();

        await landing.settingsButton.click();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
    });

    test('theme switch toggles dark mode', async ({ landing, page }) => {
        await landing.settingsButton.click();
        const toggle = page.getByRole('switch', { name: 'Switch theme' });
        const html = page.locator('html');

        const wasDark = (await toggle.getAttribute('aria-checked')) === 'true';
        const dark = /\bdark\b/;

        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-checked', String(!wasDark));
        await (wasDark ? expect(html).not : expect(html)).toHaveClass(dark);

        // Persisted in a cookie, so it survives a reload.
        await page.reload();
        await (wasDark ? expect(html).not : expect(html)).toHaveClass(dark);
    });

    test('language switch translates the page', async ({ landing, page }) => {
        await landing.settingsButton.click();
        await page
            .getByRole('group', { name: 'Language' })
            .getByRole('button', { name: 'es' })
            .click();

        await expect(
            page.getByRole('dialog', { name: 'Configuración' })
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Monta tu primera rutina' })
        ).toBeAttached();
    });

    test('Catalan translates the page and survives a reload', async ({
        landing,
        page,
    }) => {
        await landing.settingsButton.click();
        await page
            .getByRole('group', { name: 'Language' })
            .getByRole('button', { name: 'ca' })
            .click();
        await expect(
            page.getByRole('dialog', { name: 'Configuració' })
        ).toBeVisible();
        await expect(
            page
                .getByRole('group', { name: 'Idioma' })
                .getByRole('button', { name: 'ca' })
        ).toHaveAttribute('aria-pressed', 'true');

        await page.reload();
        await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
        await expect(
            page.getByRole('heading', { name: 'Munta la teva primera rutina' })
        ).toBeAttached();
    });
});
