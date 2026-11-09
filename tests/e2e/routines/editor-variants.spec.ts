import { expect, test, toast } from '../fixtures';
import { RoutinePage } from '../pages/routine-page';
import { TodayPage } from '../pages/today-page';
import { seedCompleteRoutine } from '../support/seed';

// Seeded day "Push": exercise 1 "Push press" (sets 1 and 2, ranged) and
// exercise 2 "Push row" (one fixed set).
test.describe('editor: what a set can be', () => {
    test('techniques: a preset, a custom name, and removing it', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Techniques');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.edit();
        const panel = view.dayPanel;

        await panel
            .getByRole('button', { name: 'Exercise 1, set 1 technique' })
            .click();
        await page.getByRole('button', { name: 'Top set' }).click();
        await expect(
            panel.getByRole('button', { name: 'Exercise 1, set 1 technique' })
        ).toContainText('Top set');

        await panel
            .getByRole('button', { name: 'Exercise 1, set 2 technique' })
            .click();
        await page.getByRole('button', { name: 'Custom' }).click();
        const custom = panel.getByRole('textbox', {
            name: 'Exercise 1, technique set 2',
        });
        const confirm = panel.getByRole('button', {
            name: 'Exercise 1, confirm technique set 2',
        });
        await expect(confirm).toBeDisabled();
        await custom.fill('Cluster');
        await confirm.click();

        await view.save();
        await expect(toast(page, 'Changes saved')).toBeVisible();
        await view.done.click();
        await expect(panel.getByText('Top set')).toBeVisible();
        await expect(panel.getByText('Cluster')).toBeVisible();

        // Taken off again, and saved that way.
        await view.edit();
        await panel
            .getByRole('button', { name: 'Exercise 1, set 1 technique' })
            .click();
        await page
            .getByRole('button', { name: 'Exercise 1, remove technique set 1' })
            .click();
        await view.save();
        await page.reload();
        await expect(view.dayPanel.getByText('Top set')).toHaveCount(0);
        await expect(view.dayPanel.getByText('Cluster')).toBeVisible();
    });

    test('drop sets and rest-pause sets hang off a working set', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Intensity');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.edit();
        const panel = view.dayPanel;

        await panel
            .getByRole('button', { name: 'Exercise 1, set 1 actions' })
            .click();
        await page.getByRole('button', { name: 'Add drop set' }).click();
        await panel
            .getByRole('button', { name: 'Exercise 1, DS1 amount' })
            .click();
        await page.getByRole('button', { name: '20%' }).click();
        await view.fillRange(1, 'DS1', 8, 10);

        // One kind per working set: now it only offers more drops.
        await panel
            .getByRole('button', { name: 'Exercise 1, set 1 actions' })
            .click();
        await expect(
            page.getByRole('button', { name: 'Add drop set' })
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Add rest-pause set' })
        ).toHaveCount(0);
        await page.keyboard.press('Escape');

        await panel
            .getByRole('button', { name: 'Exercise 2, set 1 actions' })
            .click();
        await page.getByRole('button', { name: 'Add rest-pause set' }).click();
        await view.fillRange(2, 'RP1', 3, 5);
        await panel
            .getByRole('textbox', { name: 'Exercise 2, RP1 amount' })
            .fill('15');

        await view.save();
        await expect(toast(page, 'Changes saved')).toBeVisible();
        await view.done.click();
        await expect(panel.getByText('Drop set −20%')).toBeVisible();
        await expect(panel.getByText('Rest-pause set 15 s')).toBeVisible();

        // Removing the sub set takes it out of the plan.
        await view.edit();
        await panel
            .getByRole('button', { name: 'Exercise 1, remove set DS1' })
            .click();
        await view.save();
        await page.reload();
        await expect(view.dayPanel.getByText('Drop set −20%')).toHaveCount(0);
        await expect(
            view.dayPanel.getByText('Rest-pause set 15 s')
        ).toBeVisible();
    });

    test('a rest-pause set without its pause is a hole in the plan', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'No pause');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.edit();

        await view.dayPanel
            .getByRole('button', { name: 'Exercise 2, set 1 actions' })
            .click();
        await page.getByRole('button', { name: 'Add rest-pause set' }).click();
        await view.fillRange(2, 'RP1', 3, 5);
        await view.save();

        await expect(page.getByText('1 thing left to finish')).toBeVisible();
        await expect(
            page
                .getByRole('listitem')
                .filter({ hasText: 'the pause is missing' })
        ).toContainText('Push row, set RP1');
        await view.done.click();
        await expect(
            page.getByText('Incomplete', { exact: true })
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Set active' })
        ).toHaveCount(0);
    });

    test('a timed set is written and trained in seconds', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Planks');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.edit();
        const panel = view.dayPanel;

        await panel
            .getByRole('combobox', { name: 'Exercise 2, reps type set 1' })
            .selectOption('time');
        const seconds = panel.getByRole('textbox', {
            name: 'Exercise 2, seconds set 1',
        });
        await seconds.fill('90');
        await expect(panel.getByText('1:30 min')).toBeVisible();
        await view.save();
        await view.done.click();
        await expect(panel.getByText('1:30 min')).toBeVisible();

        await page.getByRole('button', { name: 'Set active' }).click();
        await expect(
            toast(page, 'Planks is now your active routine')
        ).toBeVisible();
        const today = new TodayPage(page);
        await today.goto();
        await today.start.click();
        const row = today.exercise('Push row');
        await expect(
            row.getByRole('textbox', { name: 'Seconds set 1' })
        ).toBeVisible();
        await expect(
            row.getByRole('textbox', { name: 'Reps set 1' })
        ).toHaveCount(0);
    });

    test('a preview-only exercise is shown but never logged', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Warm-up first');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.edit();

        await view.dayPanel
            .getByRole('checkbox', { name: 'Exercise 2, preview only' })
            .check();
        await view.save();
        await view.done.click();
        await expect(
            view.dayPanel.getByRole('img', { name: 'Preview only' })
        ).toBeVisible();

        await page.getByRole('button', { name: 'Set active' }).click();
        await expect(
            toast(page, 'Warm-up first is now your active routine')
        ).toBeVisible();
        const today = new TodayPage(page);
        await today.goto();
        await today.start.click();
        // Two sets to log, not three: the row is only shown.
        await expect(page.getByText('0/2 sets').first()).toBeVisible();
        await expect(today.exercise('Push row')).toHaveCount(0);
        await expect(
            page.getByRole('heading', { name: 'Push row' })
        ).toBeVisible();
    });

    test('a day of nothing but previews cannot be trained', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'All talk');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.edit();
        for (const n of [1, 2]) {
            await view.dayPanel
                .getByRole('checkbox', { name: `Exercise ${n}, preview only` })
                .check();
        }
        await view.save();
        await expect(
            page.getByRole('listitem').filter({
                hasText: 'needs at least one exercise that is not preview only',
            })
        ).toContainText('This day');
    });

    test('a removed exercise with history is offered back, history and all', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Comeback', {
            isActive: true,
        });
        const today = new TodayPage(page);
        await today.goto();
        await today.start.click();
        await today.logSet('Push press', 1, '80', '8');
        await today.finish.click();
        await today.confirm('Finish anyway');

        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.edit();
        await view.dayPanel
            .getByRole('button', { name: 'Delete exercise 1' })
            .click();
        await view.save();
        await expect(toast(page, 'Changes saved')).toBeVisible();

        // Archived, not lost: a new card's name field offers it back.
        await page.getByRole('button', { name: 'Add exercise' }).click();
        const name = view.exerciseName(2);
        await name.click();
        const suggestions = page.getByRole('listbox', {
            name: 'Removed exercises of this day',
        });
        await suggestions.getByRole('option', { name: 'Push press' }).click();
        await expect(name).toHaveValue('Push press');
        await view.fillRange(2, 1, 6, 8);
        await view.save();

        // It is the day's second exercise now; its old log came back with it.
        await page.goto(`/progress/${routine.id}`);
        await page.getByRole('button', { name: 'Next exercise' }).click();
        await expect(
            page.getByRole('heading', { name: 'Push press' })
        ).toBeVisible();
        await expect(
            page.getByRole('cell', { name: /80 kg, 8 reps/ })
        ).toBeAttached();
    });
});
