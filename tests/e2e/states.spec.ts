import { expect, retype, test, toast, untilReady } from './fixtures';
import { seedCompleteRoutine } from './support/seed';

test.describe('application states', () => {
    test('a failed server action says so and changes nothing', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Flaky network');
        await page.goto(`/routines/${routine.id}`);

        // Server actions are POSTs carrying a Next-Action header.
        await page.route(`**/routines/${routine.id}`, (route) =>
            route.request().method() === 'POST' &&
            route.request().headers()['next-action']
                ? route.abort('failed')
                : route.continue()
        );
        await page.getByRole('button', { name: 'Set active' }).click();
        await expect(
            page.getByRole('alert').filter({ hasText: 'Something went wrong' })
        ).toBeVisible();

        await page.unroute(`**/routines/${routine.id}`);
        await page.reload();
        await expect(
            page.getByRole('button', { name: 'Set active' })
        ).toBeVisible();
    });

    test('offline, an action fails visibly and works again once back online', async ({
        page,
        user,
        context,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Spotty signal');
        await page.goto(`/routines/${routine.id}`);

        await context.setOffline(true);
        await page.getByRole('button', { name: 'Set active' }).click();
        await expect(toast(page, 'Something went wrong')).toBeVisible();

        await context.setOffline(false);
        await page.getByRole('button', { name: 'Set active' }).click();
        await expect(
            toast(page, 'Spotty signal is now your active routine')
        ).toBeVisible();
    });

    test('a page still loading shows its skeleton', async ({ page, user }) => {
        // The skeleton (loading.tsx) arrives with the link's prefetch, which
        // only a production build makes.
        test.skip(!!process.env.E2E_DEV, 'next dev does not prefetch');
        const routine = await seedCompleteRoutine(user.id, 'Slow to load');
        const isPrefetch = (headers: Record<string, string>) =>
            headers['next-router-prefetch'] !== undefined;

        // Hold the page's own data — never the prefetch — until the skeleton
        // has been seen.
        let release!: () => void;
        const held = new Promise<void>((resolve) => (release = resolve));
        await page.route(`**/routines/${routine.id}**`, async (route) => {
            if (!isPrefetch(route.request().headers())) await held;
            await route.continue();
        });
        const prefetched = page.waitForResponse(
            (response) =>
                response.url().includes(`/routines/${routine.id}`) &&
                isPrefetch(response.request().headers())
        );
        await page.goto('/routines');
        await prefetched;
        await page.getByRole('link', { name: /Slow to load/ }).click();
        await expect(
            page.getByRole('status').filter({ hasText: 'Loading' }).first()
        ).toBeAttached();
        release();
        await expect(
            page.getByRole('heading', { level: 1, name: 'Slow to load' })
        ).toBeVisible();
    });

    test('the server refuses what the form would never send', async ({
        page,
        user,
    }) => {
        await page.goto('/routines');
        await expect(page.getByRole('button', { name: 'Menu' })).toContainText(
            user.name
        );
        const form = page.locator('form').filter({ hasText: 'New routine' });
        const name = form.getByRole('textbox', { name: 'Name' });

        // Past the browser's own limit: only the server is left to say no.
        await untilReady(
            async () => {
                await name.evaluate((input) =>
                    input.removeAttribute('maxlength')
                );
                await retype(name, 'x'.repeat(61));
                await retype(
                    form.getByRole('spinbutton', { name: 'Duration in weeks' }),
                    '4'
                );
            },
            form.getByRole('button', { name: 'Create routine' })
        );
        await form.getByRole('button', { name: 'Create routine' }).click();
        await expect(form.getByRole('alert')).toHaveText(
            'That name is too long (max 60 characters)'
        );
        await expect(page).toHaveURL('/routines');
    });

    test('a finished routine leaves the home screen saying so', async ({
        page,
        user,
    }) => {
        await seedCompleteRoutine(user.id, 'All done', {
            isActive: true,
            cursor: 8,
        });
        await page.goto('/');
        await expect(page.getByText('You finished All done')).toBeVisible();
    });
});
