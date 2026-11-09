import { expect, retype, test, toast, untilReady } from '../fixtures';
import { RoutinePage } from '../pages/routine-page';
import { TodayPage } from '../pages/today-page';
import {
    seedCompleteRoutine,
    seedCompleteWorkout,
    seedRoutine,
} from '../support/seed';

test.describe('workouts', () => {
    test('create one: named and nothing else, opening empty', async ({
        page,
        user,
    }) => {
        await page.goto('/workouts');
        await expect(page.getByText('You have no workouts yet.')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Menu' })).toContainText(
            user.name
        );

        const form = page.locator('form').filter({ hasText: 'New workout' });
        const create = form.getByRole('button', { name: 'Create workout' });
        await expect(create).toBeDisabled();
        await untilReady(
            () => retype(form.getByRole('textbox', { name: 'Name' }), 'Arms'),
            create
        );
        await create.click();

        await expect(page).toHaveURL(/\/workouts\/[\w-]+$/);
        await expect(
            page.getByRole('heading', { level: 1, name: 'Arms' })
        ).toBeVisible();
        await expect(page.getByText('0 exercises · 0 sessions')).toBeVisible();
        await expect(page.getByText('This workout is empty')).toBeVisible();
        await expect(
            page.getByText('Incomplete', { exact: true })
        ).toBeVisible();
    });

    test('fill it in, then it is ready to start', async ({ page, user }) => {
        const workout = await seedRoutine(user.id, {
            name: 'Arms',
            kind: 'workout',
            days: [{ name: 'Arms' }],
        });
        const view = new RoutinePage(page);
        await view.goto(workout.id, 'workouts');
        await view.edit();

        await page.getByRole('button', { name: 'Add exercise' }).click();
        await view.exerciseName(1).fill('Curl');
        await view.fillRange(1, 1, 10, 12);
        await view.save();
        await expect(toast(page, 'Changes saved')).toBeVisible();
        await expect(
            page.getByText('The workout is complete. You can start it.')
        ).toBeVisible();

        await view.done.click();
        await expect(
            page.getByRole('button', { name: 'Start workout' })
        ).toBeVisible();
        await expect(page.getByText('1 exercise · 0 sessions')).toBeVisible();
    });

    test('start, log and finish a session', async ({ page, user }) => {
        const workout = await seedCompleteWorkout(user.id, 'Quick pump');
        await page.goto(`/workouts/${workout.id}`);
        await page.getByRole('button', { name: 'Start workout' }).click();

        const today = new TodayPage(page);
        await expect(page).toHaveURL('/');
        await expect(today.day).toHaveText('Quick pump');
        await expect(page.getByText('Session 1')).toBeVisible();
        // A workout is under way as soon as it starts: the sets are open.
        await today.logSet('Quick pump press', 1, '40', '12');

        await today.finish.click();
        await expect(today.dialog).toContainText('This workout is not done.');
        await today.confirm('Finish anyway');
        await expect(toast(page, 'Workout finished')).toBeVisible();
        await expect(page.getByText('Nothing in progress')).toBeVisible();

        await page.goto(`/workouts/${workout.id}`);
        await expect(page.getByText('2 exercises · 1 session')).toBeVisible();
        await page.getByRole('link', { name: 'History' }).click();
        await expect(
            page.getByRole('cell', { name: /40 kg, 12 reps/ })
        ).toBeVisible();
    });

    test('while under way it is locked for editing and can be finished from its page', async ({
        page,
        user,
    }) => {
        const workout = await seedCompleteWorkout(user.id, 'Busy', {
            isActive: true,
        });
        const view = new RoutinePage(page);
        await view.goto(workout.id, 'workouts');

        await expect(
            page.getByText('In progress', { exact: true })
        ).toBeVisible();
        await view.options.click();
        await expect(view.entry('Edit')).toHaveCount(0);
        await page.keyboard.press('Escape');

        await page.getByRole('button', { name: 'Finish workout' }).click();
        await view.confirm('Finish anyway');
        await expect(toast(page, 'Workout called off')).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Start workout' })
        ).toBeVisible();
    });

    test('starting one over an active routine asks first', async ({
        page,
        user,
    }) => {
        await seedCompleteRoutine(user.id, 'My block', { isActive: true });
        const workout = await seedCompleteWorkout(user.id, 'Extra session');
        await page.goto(`/workouts/${workout.id}`);

        await page.getByRole('button', { name: 'Start workout' }).click();
        const dialog = page.getByRole('dialog', { name: 'Start workout' });
        await expect(dialog).toContainText(
            'Your routine My block will no longer be active.'
        );
        await dialog.getByRole('button', { name: 'Start workout' }).click();
        await expect(page).toHaveURL('/');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
            'Extra session'
        );
    });

    test('a routine cannot be set active while a workout is under way', async ({
        page,
        user,
    }) => {
        await seedCompleteWorkout(user.id, 'Unfinished', { isActive: true });
        const routine = await seedCompleteRoutine(user.id, 'Waiting');
        await page.goto(`/routines/${routine.id}`);
        await page.getByRole('button', { name: 'Set active' }).click();
        await expect(
            toast(page, 'Finish the workout Unfinished first')
        ).toBeVisible();
    });

    test('rename, duplicate and delete', async ({ page, user }) => {
        const workout = await seedCompleteWorkout(user.id, 'Core');
        const view = new RoutinePage(page);
        await view.goto(workout.id, 'workouts');

        await view.menu('Rename routine');
        const rename = page.getByRole('dialog', { name: 'Rename routine' });
        await rename.getByRole('textbox', { name: 'Name' }).fill('Core blast');
        await rename.getByRole('button', { name: 'Save' }).click();
        await expect(view.heading).toHaveText('Core blast');

        await view.menu('Duplicate workout');
        await view.confirm('Duplicate workout');
        await expect(view.heading).toHaveText('Core blast (copy)');
        await expect(page).toHaveURL(/\/workouts\//);

        await view.menu('Delete workout');
        await expect(view.dialog).toContainText(
            'Everything logged in it is lost.'
        );
        await view.confirm('Delete');
        await expect(page).toHaveURL('/workouts');
        await expect(
            page.getByRole('link', { name: /Core blast \(copy\)/ })
        ).toHaveCount(0);
        await expect(
            page.getByRole('link', { name: /Core blast/ })
        ).toHaveCount(1);
    });

    test('the full list searches and filters by status', async ({
        page,
        user,
    }) => {
        await seedCompleteWorkout(user.id, 'Ready one');
        await seedRoutine(user.id, {
            name: 'Empty one',
            kind: 'workout',
            days: [{ name: 'Empty one' }],
        });
        await page.goto('/workouts/all');

        const status = page.getByRole('group', { name: 'Status' });
        await expect(
            status.getByRole('radio', { name: 'All 2' })
        ).toBeChecked();
        await status.getByText('Ready').click();
        await expect(
            page.getByRole('link', { name: /Ready one/ })
        ).toBeVisible();
        await expect(page.getByRole('link', { name: /Empty one/ })).toHaveCount(
            0
        );

        await status.getByText('All').click();
        const search = page.getByRole('searchbox', { name: 'Search workouts' });
        await search.fill('empty');
        await search.press('Enter');
        await expect(
            page.getByRole('link', { name: /Empty one/ })
        ).toBeVisible();
        await expect(page.getByRole('link', { name: /Ready one/ })).toHaveCount(
            0
        );
    });
});
