import { expect, test, toast } from '../fixtures';
import { RoutinePage } from '../pages/routine-page';
import { seedCompleteRoutine, seedCompleteWorkout } from '../support/seed';

const notFound = 'This page could not be found.';

test.describe('public and private plans', () => {
    test('a private routine does not exist for anyone else', async ({
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Secret plan');
        const stranger = await pageAs(await newUser());

        await stranger.goto(`/routines/${routine.id}`);
        await expect(stranger.getByText(notFound)).toBeVisible();
        await stranger.goto(`/progress/${routine.id}`);
        await expect(stranger.getByText(notFound)).toBeVisible();
        const exported = await stranger.request.get(
            `/routines/${routine.id}/export`
        );
        expect(exported.status()).toBe(404);
    });

    test('a public routine can be read, exported and saved as a copy', async ({
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Open plan', {
            isPublic: true,
        });
        const visitor = await pageAs(await newUser());
        const view = new RoutinePage(visitor);
        await view.goto(routine.id);

        await expect(
            visitor.getByRole('link', { name: `Routine by ${user.name}` })
        ).toBeVisible();
        await expect(visitor.getByRole('tab')).toHaveCount(2);
        // Read-only: no editing, no owner moves, no logs.
        await view.options.click();
        await expect(view.entry('Edit')).toHaveCount(0);
        await expect(view.entry('Delete routine')).toHaveCount(0);
        await expect(view.entry('People')).toHaveCount(0);
        await expect(view.entry('Export to Excel')).toBeVisible();
        await visitor.keyboard.press('Escape');
        await expect(
            visitor.getByRole('link', { name: 'History' })
        ).toHaveCount(0);

        const exported = await visitor.request.get(
            `/routines/${routine.id}/export`
        );
        expect(exported.status()).toBe(200);
        expect(exported.headers()['content-type']).toContain('spreadsheetml');

        await view.menu('Save routine');
        await expect(view.dialog).toContainText(
            'You get your own copy, with no progress.'
        );
        await view.confirm('Save routine');
        await expect(
            toast(visitor, 'Open plan saved to your routines')
        ).toBeVisible();
        await expect(visitor).not.toHaveURL(new RegExp(routine.id));
        await expect(view.heading).toHaveText('Open plan');
        await expect(
            visitor.getByRole('button', { name: 'Set active' })
        ).toBeVisible();
    });

    test('the creator link leads to their profile', async ({
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Signed work', {
            isPublic: true,
        });
        const visitor = await pageAs(await newUser());
        await visitor.goto(`/routines/${routine.id}`);
        await visitor
            .getByRole('link', { name: `Routine by ${user.name}` })
            .click();
        await expect(visitor).toHaveURL(`/profile/${user.id}`);
        await expect(visitor.getByRole('heading', { level: 1 })).toHaveText(
            user.name
        );
    });

    test('a public workout can be saved; a private one is hidden', async ({
        user,
        newUser,
        pageAs,
    }) => {
        const open = await seedCompleteWorkout(user.id, 'Open workout', {
            isPublic: true,
        });
        const closed = await seedCompleteWorkout(user.id, 'Closed workout');
        const visitor = await pageAs(await newUser());

        await visitor.goto(`/workouts/${closed.id}`);
        await expect(visitor.getByText(notFound)).toBeVisible();

        const view = new RoutinePage(visitor);
        await view.goto(open.id, 'workouts');
        await expect(
            visitor.getByRole('link', { name: `Workout by ${user.name}` })
        ).toBeVisible();
        await expect(
            visitor.getByText('2 exercises', { exact: true })
        ).toBeVisible();
        await view.menu('Save workout');
        await view.confirm('Save workout');
        await expect(
            toast(visitor, 'Open workout saved to your workouts')
        ).toBeVisible();
        await expect(
            visitor.getByRole('button', { name: 'Start workout' })
        ).toBeVisible();
    });
});
