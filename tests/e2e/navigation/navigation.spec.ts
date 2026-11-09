import { expect, test } from '../fixtures';

test.describe('navigation', () => {
    test('hero CTAs jump to their sections', async ({ landing, page }) => {
        await landing.tourCta.click();
        await expect(page).toHaveURL(/#today$/);
        await expect(
            page.getByRole('heading', { name: "Today's workout" })
        ).toBeInViewport();

        await landing.startCta.click();
        await expect(page).toHaveURL(/#join$/);
        await expect(landing.email).toBeInViewport();
    });

    for (const [name, slug] of [
        ['Privacy policy', 'privacy'],
        ['Terms of service', 'terms'],
        ['Cookie policy', 'cookies'],
    ]) {
        test(`footer opens the ${slug} page`, async ({ landing }) => {
            const { page } = landing;
            await page
                .getByRole('navigation', { name: 'Legal' })
                .getByRole('link', { name })
                .click();
            await expect(page).toHaveURL(`/legal/${slug}`);
            await expect(
                page.getByRole('heading', { level: 1, name })
            ).toBeVisible();
            await expect(page).toHaveTitle(`${name} · Krafitt`);
        });
    }

    test('back button returns to the previous page', async ({
        landing,
        page,
    }) => {
        await page.getByRole('link', { name: 'Privacy policy' }).click();
        await expect(page).toHaveURL('/legal/privacy');
        await page.getByRole('button', { name: 'Back' }).click();
        await expect(page).toHaveURL('/');
        await expect(landing.hero).toBeVisible();
    });

    test('logo leads home from a deep link', async ({ page }) => {
        await page.goto('/legal/terms');
        await page.getByRole('link', { name: 'Krafitt', exact: true }).click();
        await expect(page).toHaveURL('/');
    });
});
