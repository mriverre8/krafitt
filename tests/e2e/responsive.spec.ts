import { expect, test } from './fixtures';
import { RoutinePage } from './pages/routine-page';
import { seedCompleteRoutine } from './support/seed';

for (const { name, width, height } of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
]) {
    test.describe(`${name} viewport`, () => {
        test.use({ viewport: { width, height } });

        test('fits the screen without horizontal scroll', async ({
            landing,
            page,
        }) => {
            await expect(landing.hero).toBeVisible();
            const overflow = await page.evaluate(
                () =>
                    document.documentElement.scrollWidth -
                    document.documentElement.clientWidth
            );
            expect(overflow).toBe(0);
        });

        test('keeps the main actions reachable', async ({ landing }) => {
            await expect(landing.startCta).toBeInViewport();
            await expect(landing.settingsButton).toBeInViewport();
            await landing.startCta.click();
            await expect(landing.submit).toBeInViewport();
        });
    });
}

const overflowOf = (page: import('@playwright/test').Page) =>
    page.evaluate(
        () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
    );

test.describe('signed in: desktop', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('the header carries the section links', async ({ page, user }) => {
        await page.goto('/');
        const header = page.getByRole('banner');
        await expect(
            header.getByRole('button', { name: 'Menu' })
        ).toContainText(user.name);
        for (const name of ['Today', 'Workouts', 'Routines']) {
            await expect(
                header.getByRole('link', { name, exact: true })
            ).toBeVisible();
        }
        await header
            .getByRole('link', { name: 'Workouts', exact: true })
            .click();
        await expect(page).toHaveURL('/workouts');
    });
});

for (const { name, width, height } of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
]) {
    test.describe(`signed in: ${name}`, () => {
        test.use({ viewport: { width, height } });

        test('the menu takes over navigation, and app pages fit the screen', async ({
            page,
            user,
        }) => {
            const routine = await seedCompleteRoutine(user.id, 'Pocket plan', {
                isActive: true,
            });
            await page.goto('/');
            const header = page.getByRole('banner');
            if (width < 768) {
                await expect(
                    header.getByRole('link', { name: 'Routines', exact: true })
                ).toBeHidden();
            }
            await header.getByRole('button', { name: 'Menu' }).click();
            await page
                .getByRole('link', { name: 'Routines', exact: true })
                .last()
                .click();
            await expect(page).toHaveURL('/routines');

            for (const path of [
                '/',
                '/routines',
                `/routines/${routine.id}`,
                `/profile/${user.id}`,
            ]) {
                await page.goto(path);
                await expect(
                    page.getByRole('heading', { level: 1 })
                ).toBeVisible();
                expect(await overflowOf(page), path).toBe(0);
            }
        });

        test('training controls stay within reach', async ({ page, user }) => {
            await seedCompleteRoutine(user.id, 'Thumb zone', {
                isActive: true,
            });
            await page.goto('/');
            const start = page.getByRole('button', {
                name: /^(Start|Continue)/,
            });
            await expect(start).toBeInViewport();
            await start.click();
            await expect(
                page.getByRole('button', { name: 'Finish workout' })
            ).toBeInViewport();
        });

        test('the editor save bar follows the screen', async ({
            page,
            user,
        }) => {
            const routine = await seedCompleteRoutine(
                user.id,
                'Edit on the go'
            );
            const view = new RoutinePage(page);
            await view.goto(routine.id);
            await view.edit();
            await view.exerciseName(1).fill('Tweaked press');
            await expect(view.saveChanges).toBeInViewport();
        });
    });
}
