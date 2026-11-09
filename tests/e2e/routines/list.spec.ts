import { expect, test } from '../fixtures';
import { seedCompleteRoutine, seedRoutine } from '../support/seed';

test.describe('routine lists', () => {
    test('the index previews five and links to the full list', async ({
        page,
        user,
    }) => {
        for (let i = 1; i <= 6; i++)
            await seedRoutine(user.id, { name: `Plan ${i}` });
        await page.goto('/routines');
        await expect(page.getByRole('link', { name: /^Plan \d/ })).toHaveCount(
            5
        );

        await page.getByRole('link', { name: 'View more' }).click();
        await expect(page).toHaveURL('/routines/all');
        await expect(
            page.getByRole('heading', { name: 'My routines' })
        ).toBeVisible();
        await expect(page.getByRole('link', { name: /^Plan \d/ })).toHaveCount(
            6
        );
    });

    test('search narrows by name, and says so when nothing matches', async ({
        page,
        user,
    }) => {
        await seedRoutine(user.id, { name: 'Leg day' });
        await seedRoutine(user.id, { name: 'Upper body' });
        await page.goto('/routines/all');
        const search = page.getByRole('searchbox', { name: 'Search routines' });

        await search.fill('leg');
        await search.press('Enter');
        await expect(page).toHaveURL(/q=leg/);
        await expect(page.getByRole('link', { name: /Leg day/ })).toBeVisible();
        await expect(
            page.getByRole('link', { name: /Upper body/ })
        ).toHaveCount(0);

        await search.fill('zzz');
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(
            page.getByText('Nothing matches your search.')
        ).toBeVisible();

        await search.fill('');
        await search.press('Enter');
        await expect(
            page.getByRole('link', { name: /Leg day|Upper body/ })
        ).toHaveCount(2);
    });

    test('the status filter counts and filters', async ({ page, user }) => {
        await seedCompleteRoutine(user.id, 'Training now', { isActive: true });
        await seedCompleteRoutine(user.id, 'Ready to go');
        await seedRoutine(user.id, { name: 'Still a draft' });
        await page.goto('/routines/all');

        const status = page.getByRole('group', { name: 'Status' });
        await expect(
            status.getByRole('radio', { name: 'All 3' })
        ).toBeChecked();
        await expect(
            status.getByRole('radio', { name: 'Active 1' })
        ).toBeAttached();
        await expect(
            status.getByRole('radio', { name: 'Finished 0' })
        ).toBeAttached();

        await status.getByText('Incomplete').click();
        await expect(page).toHaveURL(/status=incomplete/);
        await expect(
            page.getByRole('link', { name: /Still a draft/ })
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: /Training now|Ready to go/ })
        ).toHaveCount(0);

        await status.getByText('Active').click();
        await expect(page).toHaveURL(/status=active/);
        await expect(
            page.getByRole('link', { name: /Training now/ })
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: /Still a draft/ })
        ).toHaveCount(0);
    });

    test('pagination walks ten at a time and keeps the search', async ({
        page,
        user,
    }) => {
        for (let i = 1; i <= 12; i++)
            await seedRoutine(user.id, { name: `Block ${i}` });
        await page.goto('/routines/all?q=Block');
        const pager = page.getByRole('navigation', { name: 'Pagination' });

        await expect(pager).toContainText('Page 1 of 2');
        await expect(
            page.getByRole('link', { name: /^Block \d+/ })
        ).toHaveCount(10);
        await pager.getByRole('link', { name: 'Next' }).click();
        await expect(page).toHaveURL(/q=Block.*page=2|page=2.*q=Block/);
        await expect(pager).toContainText('Page 2 of 2');
        await expect(
            page.getByRole('link', { name: /^Block \d+/ })
        ).toHaveCount(2);
        await expect(pager.getByRole('link', { name: 'Next' })).toHaveCount(0);

        await pager.getByRole('link', { name: 'Previous' }).click();
        await expect(pager).toContainText('Page 1 of 2');
    });

    test('a card opens its routine and shows its progress', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Halfway', {
            isActive: true,
            cursor: 3,
        });
        await page.goto('/routines');
        const card = page.getByRole('link', { name: /Halfway/ });
        await expect(card).toContainText('3/8 days');
        await expect(card).toContainText('Active');
        await card.click();
        await expect(page).toHaveURL(`/routines/${routine.id}`);
    });

    test('tabs move between my routines and the ones shared with me', async ({
        page,
        user,
    }) => {
        await page.goto('/routines');
        await expect(page.getByRole('button', { name: 'Menu' })).toContainText(
            user.name
        );
        await page.getByRole('link', { name: 'Shared with me' }).click();
        await expect(page).toHaveURL('/routines/shared');
        await expect(page.getByText('Nothing shared yet')).toBeVisible();
    });
});
