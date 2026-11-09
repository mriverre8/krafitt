import { randomUUID } from 'node:crypto';
import { expect, test } from './fixtures';
import { seedCompleteWorkout } from './support/seed';

const notFound = 'This page could not be found.';

test.describe('not found', () => {
    test('unknown route answers 404', async ({ page }) => {
        const response = await page.goto('/this-route-does-not-exist');
        expect(response?.status()).toBe(404);
        await expect(page.getByText(notFound)).toBeVisible();
        // The root layout still wraps the page, so the user can get back.
        await page.getByRole('link', { name: 'Krafitt', exact: true }).click();
        await expect(page).toHaveURL('/');
    });

    test('unknown legal document shows the not-found page', async ({
        page,
    }) => {
        // No status check: legal/[doc] has a loading.tsx, so the response is
        // already streaming (200) when notFound() runs. Next marks it noindex.
        await page.goto('/legal/not-a-doc');
        await expect(page.getByText(notFound)).toBeVisible();
        await expect(
            page.locator('meta[name="robots"]').first()
        ).toHaveAttribute('content', /noindex/);
    });

    for (const section of ['routines', 'workouts', 'profile', 'progress']) {
        test(`signed in, an unknown /${section}/[id] is not found`, async ({
            page,
            user,
        }) => {
            await page.goto(`/${section}/${randomUUID()}`);
            await expect(page.getByText(notFound)).toBeVisible();
            await expect(
                page.getByRole('button', { name: 'Menu' })
            ).toContainText(user.name);
        });
    }

    test('a workout is not found under /routines, nor a routine under /workouts', async ({
        page,
        user,
    }) => {
        const workout = await seedCompleteWorkout(user.id, 'Leg day');
        await page.goto(`/routines/${workout.id}`);
        await expect(page.getByText(notFound)).toBeVisible();
        await page.goto(`/workouts/${workout.id}`);
        await expect(
            page.getByRole('heading', { level: 1, name: 'Leg day' })
        ).toBeVisible();
    });
});
