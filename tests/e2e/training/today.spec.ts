import { expect, test, toast } from '../fixtures';
import { TodayPage } from '../pages/today-page';
import { seedCompleteRoutine } from '../support/seed';

// Seeded days are "Push" and "Pull": a "<day> press" of two ranged sets and a
// "<day> row" of one fixed set — three sets a day.
test.describe('training today', () => {
    test('idle: nothing active, nothing owed', async ({ page, user }) => {
        await page.goto('/');
        await expect(page.getByText('Nothing in progress')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Menu' })).toContainText(
            user.name
        );
    });

    test('the active routine puts its day on the home screen', async ({
        page,
        user,
    }) => {
        await seedCompleteRoutine(user.id, 'Upper Lower', { isActive: true });
        const today = new TodayPage(page);
        await today.goto();

        await expect(today.day).toHaveText('Push');
        await expect(page.getByText('Upper Lower')).toBeVisible();
        await expect(page.getByText('Week 1 of 4')).toBeVisible();
        // Read, not logged, until the day is started.
        await expect(
            page.getByRole('textbox', { name: 'Weight set 1' })
        ).toHaveCount(0);
        await expect(page.getByRole('link', { name: 'History' })).toBeVisible();
    });

    test('log sets in order, with their effort, and keep them across a reload', async ({
        page,
        user,
    }) => {
        await seedCompleteRoutine(user.id, 'Logbook', { isActive: true });
        const today = new TodayPage(page);
        await today.goto();
        await today.start.click();
        await expect(page.getByText('0/3 sets').first()).toBeVisible();

        const press = today.exercise('Push press');
        // The next set opens only once the one before it is in.
        await expect(
            press.getByRole('textbox', { name: 'Weight set 2' })
        ).toBeDisabled();

        // Nothing to save until both numbers make sense.
        await press.getByRole('textbox', { name: 'Weight set 1' }).fill('80');
        await press.getByRole('textbox', { name: 'Reps set 1' }).fill('0');
        await expect(
            press.getByRole('button', { name: 'Save set 1' })
        ).toBeDisabled();
        // Only digits reach the box.
        await press.getByRole('textbox', { name: 'Reps set 1' }).fill('8x');
        await expect(
            press.getByRole('textbox', { name: 'Reps set 1' })
        ).toHaveValue('8');

        await press.getByRole('button', { name: 'Save set 1' }).click();
        await press.getByRole('radio', { name: 'Went to failure' }).click();
        await expect(
            press.getByRole('radio', { name: 'Went to failure' })
        ).toHaveAttribute('aria-checked', 'true');
        await press.getByRole('button', { name: 'Bank set 1' }).click();
        await expect(
            press.getByRole('button', { name: 'Save set 1' })
        ).toHaveAttribute('data-done', 'true');
        await expect(page.getByText('1/3 sets').first()).toBeVisible();
        await expect(
            press.getByRole('textbox', { name: 'Weight set 2' })
        ).toBeEnabled();

        await page.reload();
        await expect(
            press.getByRole('textbox', { name: 'Weight set 1' })
        ).toHaveValue('80');
        await expect(
            press.getByRole('textbox', { name: 'Reps set 1' })
        ).toHaveValue('8');
        await expect(page.getByText('1/3 sets').first()).toBeVisible();

        // The history has it, effort included.
        await page.getByRole('link', { name: 'History' }).click();
        await expect(
            page.getByRole('heading', { name: /History/ })
        ).toBeVisible();
        await expect(
            page.getByRole('cell', { name: /80 kg, 8 reps.*Went to failure/ })
        ).toBeVisible();
    });

    test('a weight of zero reads as bodyweight', async ({ page, user }) => {
        await seedCompleteRoutine(user.id, 'Calisthenics', { isActive: true });
        const today = new TodayPage(page);
        await today.goto();
        await today.start.click();
        await today
            .exercise('Push press')
            .getByRole('textbox', { name: 'Weight set 1' })
            .fill('0');
        await expect(
            today.exercise('Push press').getByText('Bodyweight')
        ).toBeVisible();
    });

    test('finishing with blanks asks, then moves on to the next day', async ({
        page,
        user,
    }) => {
        await seedCompleteRoutine(user.id, 'Moving on', { isActive: true });
        const today = new TodayPage(page);
        await today.goto();
        await today.start.click();
        await today.logSet('Push press', 1, '60', '10');

        await today.finish.click();
        await expect(today.dialog).toContainText('This workout is not done.');
        await today.confirm('Finish anyway');
        await expect(toast(page, 'Workout finished')).toBeVisible();
        await expect(today.day).toHaveText('Pull');
    });

    test('finishing with nothing logged calls the day off', async ({
        page,
        user,
    }) => {
        await seedCompleteRoutine(user.id, 'Called off', { isActive: true });
        const today = new TodayPage(page);
        await today.goto();
        await today.start.click();

        await today.finish.click();
        await expect(today.dialog).toContainText(
            'You have not logged a single set'
        );
        await today.confirm('Finish anyway');
        await expect(toast(page, 'Workout called off')).toBeVisible();
        await expect(today.day).toHaveText('Push');
        await expect(today.start).toBeVisible();
    });

    test('logging every set completes the day', async ({ page, user }) => {
        await seedCompleteRoutine(user.id, 'Full day', { isActive: true });
        const today = new TodayPage(page);
        await today.goto();
        await today.start.click();
        await today.logSet('Push press', 1, '80', '8');
        await today.logSet('Push press', 2, '70', '10');
        await today.logSet('Push row', 1, '50', '10');

        await expect(
            page.getByRole('status').filter({ hasText: 'Workout complete' })
        ).toBeVisible();
        await page.reload();
        await expect(today.day).toHaveText('Pull');
    });

    test('change day trains another day of the week first', async ({
        page,
        user,
    }) => {
        await seedCompleteRoutine(user.id, 'Flexible', { isActive: true });
        const today = new TodayPage(page);
        await today.goto();

        await page.getByRole('button', { name: 'Change day' }).click();
        const dialog = page.getByRole('dialog', { name: 'Change day' });
        await expect(
            dialog.getByRole('button', { name: /Push/ })
        ).toBeDisabled();
        await dialog.getByRole('button', { name: /Pull/ }).click();
        await expect(today.day).toHaveText('Pull');
    });

    test('skip week asks, then jumps to next week', async ({ page, user }) => {
        await seedCompleteRoutine(user.id, 'Skipper', { isActive: true });
        const today = new TodayPage(page);
        await today.goto();

        await page.getByRole('button', { name: 'Skip week' }).click();
        await expect(today.dialog).toContainText('You move on to next week.');
        await today.confirm('Skip week');
        await expect(toast(page, 'Week skipped')).toBeVisible();
        await expect(page.getByText('Week 2 of 4')).toBeVisible();
        await expect(today.day).toHaveText('Push');
    });

    test('the next week shows what was lifted the week before', async ({
        page,
        user,
    }) => {
        await seedCompleteRoutine(user.id, 'Progressive', { isActive: true });
        const today = new TodayPage(page);
        await today.goto();
        await today.start.click();
        await today.logSet('Push press', 1, '82.5', '6');
        await today.finish.click();
        await today.confirm('Finish anyway');
        await expect(today.day).toHaveText('Pull');

        await page.getByRole('button', { name: 'Skip week' }).click();
        await today.confirm('Skip week');
        await expect(page.getByText('Week 2 of 4')).toBeVisible();
        await today.start.click();
        const press = today.exercise('Push press');
        await expect(
            press.getByRole('textbox', { name: 'Weight set 1' })
        ).toHaveAttribute('placeholder', '82.5 kg');
        await expect(
            press.getByRole('textbox', { name: 'Reps set 1' })
        ).toHaveAttribute('placeholder', '6 reps');
    });

    test('the last week can finish the whole routine', async ({
        page,
        user,
    }) => {
        await seedCompleteRoutine(user.id, 'One week wonder', {
            isActive: true,
            weeks: 1,
        });
        const today = new TodayPage(page);
        await today.goto();

        await page.getByRole('button', { name: 'Finish routine' }).click();
        await expect(today.dialog).toContainText('This is the last week');
        await today.confirm('Finish routine');
        await expect(toast(page, 'Routine finished')).toBeVisible();
        await expect(
            page.getByText('You finished One week wonder')
        ).toBeVisible();
    });

    test('a day left incomplete is taken up again with what it had locked', async ({
        page,
        user,
    }) => {
        await seedCompleteRoutine(user.id, 'Unfinished business', {
            isActive: true,
        });
        const today = new TodayPage(page);
        await today.goto();

        // Train Pull ahead of Push, and leave it half done.
        await page.getByRole('button', { name: 'Change day' }).click();
        await page
            .getByRole('dialog', { name: 'Change day' })
            .getByRole('button', { name: /Pull/ })
            .click();
        await expect(today.day).toHaveText('Pull');
        await today.start.click();
        await today.logSet('Pull press', 1, '70', '8');
        await today.finish.click();
        await today.confirm('Finish anyway');
        await expect(today.day).toHaveText('Push');

        // Push is back on screen; Pull waits as incomplete.
        const change = page.getByRole('button', {
            name: 'Change day (1 incomplete)',
        });
        await change.click();
        const dialog = page.getByRole('dialog', { name: 'Change day' });
        await expect(
            dialog.getByRole('button', { name: /Pull/ })
        ).toContainText('Incomplete');
        await dialog.getByRole('button', { name: /Pull/ }).click();
        await expect(today.day).toHaveText('Pull');

        await page.getByRole('button', { name: /^Continue/ }).click();
        const press = today.exercise('Pull press');
        // What was logged then stays as it was; the blanks can be filled in.
        await expect(
            press.getByRole('textbox', { name: 'Weight set 1' })
        ).toHaveValue('70');
        await expect(
            press.getByRole('textbox', { name: 'Weight set 1' })
        ).toBeDisabled();
        await expect(
            press.getByRole('textbox', { name: 'Weight set 2' })
        ).toBeEnabled();
        await today.logSet('Pull press', 2, '60', '10');
        await expect(page.getByText('2/3 sets').first()).toBeVisible();
    });
});
