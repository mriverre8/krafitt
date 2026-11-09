import { expect, test, toast } from '../fixtures';
import { RoutinePage } from '../pages/routine-page';
import { seedCompleteRoutine, seedRoutine } from '../support/seed';

test.describe('routine editor', () => {
    test('build a routine from scratch, save it and set it active', async ({
        page,
        user,
    }) => {
        const routine = await seedRoutine(user.id, { name: 'Built by hand' });
        const editor = new RoutinePage(page);
        await editor.goto(routine.id);
        await expect(page.getByText('This routine is empty')).toBeVisible();

        await editor.edit();
        await expect(page.getByText('Start with the first day')).toBeVisible();
        await editor.addDay('Upper');

        // A new day is one blank card: two holes until it is filled in.
        await expect(
            page.getByRole('tab', { name: /Day 1, Upper/ })
        ).toBeVisible();
        await expect(page.getByText('2 things left to finish')).toBeVisible();
        const showErrors = page.getByRole('button', { name: 'Show errors' });
        await showErrors.click();
        await expect(
            page.getByRole('button', { name: 'Hide errors' })
        ).toHaveAttribute('aria-pressed', 'true');

        await editor.exerciseName(1).fill('Bench press');
        await editor.fillRange(1, 1, 6, 8);
        await editor.save();
        await expect(toast(page, 'Changes saved')).toBeVisible();
        await expect(
            page.getByText('The routine is complete. You can set it as active.')
        ).toBeVisible();

        await editor.done.click();
        await page.getByRole('button', { name: 'Set active' }).click();
        await expect(
            toast(page, 'Built by hand is now your active routine')
        ).toBeVisible();
        await expect(page.getByText('Active', { exact: true })).toBeVisible();

        // Persisted: the plan survives a reload and the home screen trains it.
        await page.reload();
        await expect(
            page.getByRole('heading', { name: 'Bench press' })
        ).toBeVisible();
        await page.goto('/');
        await expect(
            page.getByRole('heading', { level: 1, name: 'Upper' })
        ).toBeVisible();
        await expect(page.getByText('Week 1 of 4')).toBeVisible();
    });

    test('a routine with holes cannot be set active', async ({
        page,
        user,
    }) => {
        const routine = await seedRoutine(user.id, {
            name: 'Half written',
            days: [{ name: 'Legs', exercises: [{ name: 'Squat', sets: [] }] }],
        });
        await page.goto(`/routines/${routine.id}`);
        await expect(
            page.getByText('Incomplete', { exact: true })
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Set active' })
        ).toHaveCount(0);
    });

    test('undo puts the day back as it was saved', async ({ page, user }) => {
        const routine = await seedCompleteRoutine(user.id, 'Undo me');
        const editor = new RoutinePage(page);
        await editor.goto(routine.id);
        await editor.edit();

        await editor.exerciseName(1).fill('Renamed press');
        await expect(editor.saveChanges).toBeVisible();
        await page.getByRole('button', { name: 'Undo changes' }).click();

        await expect(editor.exerciseName(1)).toHaveValue('Push press');
        await expect(editor.saveChanges).toBeHidden();
    });

    test('leaving edit mode with unsaved changes asks before discarding', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Careful');
        const editor = new RoutinePage(page);
        await editor.goto(routine.id);
        await editor.edit();
        await editor.exerciseName(1).fill('Never saved');
        await expect(
            page.getByRole('tab', { name: /Day 1, Push, unsaved changes/ })
        ).toBeVisible();

        await editor.done.click();
        const dialog = page.getByRole('dialog', { name: 'Unsaved changes' });
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await expect(editor.exerciseName(1)).toHaveValue('Never saved');

        await editor.done.click();
        await dialog.getByRole('button', { name: 'Discard changes' }).click();
        await expect(editor.done).toBeHidden();
        await page.reload();
        await expect(
            page.getByRole('heading', { name: 'Push press' })
        ).toBeVisible();
        await expect(page.getByText('Never saved')).toHaveCount(0);
    });

    test('exercises: add, remove, reorder and add sets, then persist', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Shuffle');
        const editor = new RoutinePage(page);
        await editor.goto(routine.id);
        await editor.edit();

        // Added and removed again: nothing left to save.
        await page.getByRole('button', { name: 'Add exercise' }).click();
        await expect(editor.exerciseName(3)).toBeVisible();
        await page.getByRole('button', { name: 'Delete exercise 3' }).click();
        await expect(editor.exerciseName(3)).toHaveCount(0);
        await expect(editor.saveChanges).toBeHidden();

        await page.getByRole('button', { name: 'Move exercise 2 up' }).click();
        await expect(editor.exerciseName(1)).toHaveValue('Push row');
        await page
            .getByRole('button', { name: 'Add set 2 to exercise 1' })
            .click();
        await editor.dayPanel
            .getByRole('combobox', { name: 'Exercise 1, reps type set 2' })
            .selectOption('amrap');
        await editor.save();
        await expect(toast(page, 'Changes saved')).toBeVisible();

        await page.reload();
        await editor.edit();
        await expect(editor.exerciseName(1)).toHaveValue('Push row');
        await expect(editor.exerciseName(2)).toHaveValue('Push press');
        await expect(
            editor.dayPanel.getByRole('combobox', {
                name: 'Exercise 1, reps type set 2',
            })
        ).toHaveValue('amrap');
    });

    test('days: rename, reorder and delete before the routine starts', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Split', {
            dayNames: ['Push', 'Pull', 'Legs'],
        });
        const editor = new RoutinePage(page);
        await editor.goto(routine.id);
        await editor.edit();

        await page.getByRole('tab', { name: /Day 2, Pull/ }).click();
        await editor.dayPanel
            .getByRole('button', { name: 'Day options' })
            .click();
        await page.getByRole('button', { name: 'Rename day' }).click();
        const rename = page.getByRole('dialog', { name: 'Rename day' });
        await rename.getByRole('textbox', { name: 'Day name' }).fill('Back');
        await rename.getByRole('button', { name: 'Save' }).click();
        await expect(
            page.getByRole('tab', { name: /Day 2, Back/ })
        ).toBeVisible();

        await page.getByRole('button', { name: 'Reorder days' }).click();
        const reorder = page.getByRole('dialog', { name: 'Reorder days' });
        const save = reorder.getByRole('button', { name: 'Save' });
        await expect(save).toBeDisabled();
        await reorder.getByRole('button', { name: 'Move Legs up' }).click();
        await reorder.getByRole('button', { name: 'Move Legs up' }).click();
        await expect(reorder.getByText('Was day 3')).toBeVisible();
        await save.click();
        await expect(toast(page, 'Day order saved')).toBeVisible();
        await expect(
            page.getByRole('tab', { name: /Day 1, Legs/ })
        ).toBeVisible();

        await page.getByRole('tab', { name: /Day 2, Push/ }).click();
        await editor.dayPanel
            .getByRole('button', { name: 'Day options' })
            .click();
        await page.getByRole('button', { name: 'Delete day' }).click();
        const confirm = page.getByRole('dialog', { name: 'Delete day' });
        await expect(confirm).toContainText('Delete Push and its exercises?');
        await confirm.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByRole('tab')).toHaveCount(2);

        await page.reload();
        await expect(page.getByText('4 weeks · 2 days per week')).toBeVisible();
        await expect(
            page.getByRole('tab', { name: 'Day 1, Legs' })
        ).toBeVisible();
        await expect(
            page.getByRole('tab', { name: 'Day 2, Back' })
        ).toBeVisible();
    });

    test('once started, days can no longer be added, moved or deleted', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Under way', {
            isActive: true,
        });
        const editor = new RoutinePage(page);
        await editor.goto(routine.id);
        await editor.edit();

        await expect(page.getByRole('button', { name: 'Add day' })).toHaveCount(
            0
        );
        await expect(
            page.getByRole('button', { name: 'Reorder days' })
        ).toHaveCount(0);
        await editor.dayPanel
            .getByRole('button', { name: 'Day options' })
            .click();
        await expect(
            page.getByRole('button', { name: 'Rename day' })
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Delete day' })
        ).toHaveCount(0);
    });

    test('day tabs switch with buttons and arrow keys', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Tabs', {
            dayNames: ['Push', 'Pull'],
        });
        await page.goto(`/routines/${routine.id}`);
        const push = page.getByRole('tab', { name: 'Day 1, Push' });
        const pull = page.getByRole('tab', { name: 'Day 2, Pull' });

        await expect(push).toHaveAttribute('aria-selected', 'true');
        await expect(
            page.getByRole('button', { name: 'Previous day' })
        ).toBeDisabled();
        await page.getByRole('button', { name: 'Next day' }).click();
        await expect(pull).toHaveAttribute('aria-selected', 'true');
        await expect(
            page.getByRole('heading', { name: 'Pull press' })
        ).toBeVisible();

        await pull.press('ArrowLeft');
        await expect(push).toHaveAttribute('aria-selected', 'true');
        await expect(push).toBeFocused();
    });
});
