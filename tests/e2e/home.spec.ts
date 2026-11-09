import { expect, test } from './fixtures';

test.describe('home page (signed out)', () => {
    test('loads with title and hero', async ({ landing, page }) => {
        await expect(page).toHaveTitle('Krafitt');
        await expect(landing.hero).toBeVisible();
        await expect(landing.startCta).toBeVisible();
        await expect(landing.tourCta).toBeVisible();
    });

    test('shows every landing section', async ({ landing, page }) => {
        for (const name of [
            "Today's workout",
            'Write the plan',
            'Every set, week by week',
            'Write your first routine',
        ]) {
            await expect(
                page.getByRole('heading', { level: 2, name })
            ).toBeVisible();
        }
        await expect(landing.join).toBeVisible();
    });

    test('renders header and footer chrome', async ({ landing }) => {
        const { page } = landing;
        await expect(
            page.getByRole('link', { name: 'Krafitt', exact: true })
        ).toHaveAttribute('href', '/');
        const project = page.getByRole('navigation', { name: 'Project links' });
        await expect(
            project.getByRole('link', { name: 'Source code' })
        ).toHaveAttribute('href', 'https://github.com/mriverre8/krafitt');
        await expect(
            project.getByRole('link', { name: 'Contact' })
        ).toHaveAttribute('href', /^mailto:/);
    });
});
