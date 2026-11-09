import { expect, test } from '../fixtures';
import { TodayPage } from '../pages/today-page';
import {
    seedCompleteRoutine,
    seedCompleteWorkout,
    seedMember,
} from '../support/seed';

/** Logs two sets of Push (80×8, 70×10) and closes the day. */
async function trainPush(today: TodayPage) {
    await today.goto();
    await today.start.click();
    await today.logSet('Push press', 1, '80', '8');
    await today.logSet('Push press', 2, '70', '10');
    await today.finish.click();
    await today.confirm('Finish anyway');
    await expect(today.day).toHaveText('Pull');
}

test.describe('history', () => {
    test('the summary adds up what was lifted', async ({ page, user }) => {
        const routine = await seedCompleteRoutine(user.id, 'Tally', {
            isActive: true,
        });
        await trainPush(new TodayPage(page));
        await page.goto(`/progress/${routine.id}`);

        const summary = page.getByRole('region', { name: 'Summary' });
        // 80 × 8 + 70 × 10.
        await expect(
            summary.getByRole('definition').filter({ hasText: '1,340 kg' })
        ).toBeVisible();
        await expect(summary.getByText('Week 1 of 4')).toBeVisible();
        await expect(summary.getByText('How the sets felt')).toBeVisible();
    });

    test('exercises and days are browsed one at a time', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Browse', {
            isActive: true,
        });
        await trainPush(new TodayPage(page));
        await page.goto(`/progress/${routine.id}`);

        const panel = page.getByRole('tabpanel').filter({ visible: true });
        const counter = panel
            .getByRole('status')
            .filter({ hasText: /exercise \d of \d/ });
        await expect(counter).toContainText('Push press, exercise 1 of 2');
        await expect(
            panel.getByRole('button', { name: 'Previous exercise' })
        ).toBeDisabled();
        await expect(
            panel.getByRole('cell', { name: /70 kg, 10 reps/ })
        ).toBeAttached();

        await panel.getByRole('button', { name: 'Next exercise' }).click();
        await expect(counter).toContainText('Push row, exercise 2 of 2');
        // Left blank that day, and in the past now: not logged.
        await expect(
            panel.getByRole('cell', { name: /Not logged/ }).first()
        ).toBeAttached();

        await page.getByRole('tab', { name: 'Day 2, Pull' }).click();
        await expect(
            page
                .getByRole('tabpanel')
                .filter({ visible: true })
                .getByRole('heading', { name: 'Pull press' })
        ).toBeVisible();
    });

    test('the history exports as a spreadsheet', async ({ page, user }) => {
        const routine = await seedCompleteRoutine(user.id, 'Paper trail', {
            isActive: true,
        });
        await trainPush(new TodayPage(page));
        await page.goto(`/progress/${routine.id}`);

        const download = page.waitForEvent('download');
        await page.getByRole('link', { name: 'Export to Excel' }).click();
        expect((await download).url()).toContain(
            `/progress/${routine.id}/export`
        );

        const response = await page.request.get(
            `/progress/${routine.id}/export`
        );
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('spreadsheetml');
        expect(response.headers()['content-disposition']).toContain(
            encodeURIComponent('Paper trail - History')
        );
        expect((await response.body()).subarray(0, 2).toString()).toBe('PK');
    });

    test('members read and export it; strangers get nothing', async ({
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Team log', {
            isActive: true,
        });
        const member = await newUser();
        await seedMember(routine.id, member.id);
        const memberPage = await pageAs(member);
        await memberPage.goto(`/progress/${routine.id}`);
        await expect(
            memberPage.getByRole('heading', { level: 1 })
        ).toContainText('Team log');
        expect(
            (
                await memberPage.request.get(`/progress/${routine.id}/export`)
            ).status()
        ).toBe(200);

        const stranger = await pageAs(await newUser());
        expect(
            (
                await stranger.request.get(`/progress/${routine.id}/export`)
            ).status()
        ).toBe(404);
    });

    test('a workout reads by sessions and does not export', async ({
        page,
        user,
    }) => {
        const workout = await seedCompleteWorkout(user.id, 'Repeat me', {
            cursor: 1,
        });
        await page.goto(`/progress/${workout.id}`);
        await expect(
            page
                .getByRole('region', { name: 'Summary' })
                .getByText('Sessions', { exact: true })
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: 'Export to Excel' })
        ).toHaveCount(0);
        expect(
            (await page.request.get(`/progress/${workout.id}/export`)).status()
        ).toBe(404);
    });
});
