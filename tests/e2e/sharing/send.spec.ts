import { randomUUID } from 'node:crypto';
import { expect, test, toast } from '../fixtures';
import { RoutinePage } from '../pages/routine-page';
import { seedCompleteRoutine, seedCompleteWorkout, sql } from '../support/seed';

test.describe('sending a routine', () => {
    test('send with membership, accept, and both sides see it', async ({
        page,
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Gift plan');
        const friend = await newUser('Gus Receiver');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.menu('Send routine');

        const dialog = page.getByRole('dialog', { name: 'Send routine' });
        const send = dialog.getByRole('button', { name: 'Send routine' });
        await expect(send).toBeDisabled();
        await dialog
            .getByRole('textbox', { name: "User's account" })
            .fill(friend.email);
        await dialog.getByRole('button', { name: 'Search' }).click();
        await expect(dialog.getByText('Gus Receiver')).toBeVisible();
        await dialog
            .getByRole('checkbox', { name: 'Add me as a member of their copy' })
            .check();
        await send.click();
        await expect(toast(page, 'Routine sent to Gus Receiver')).toBeVisible();

        const friendPage = await pageAs(friend);
        await friendPage.goto('/routines/requests');
        await expect(
            friendPage.getByText(
                'Wants to send you Gift plan and join it as a member'
            )
        ).toBeVisible();
        await friendPage.getByRole('button', { name: 'Accept' }).click();
        await expect(
            toast(friendPage, 'Gift plan is now in your routines')
        ).toBeVisible();

        // Their own copy, which they own.
        await friendPage.goto('/routines');
        await friendPage.getByRole('link', { name: /Gift plan/ }).click();
        await expect(
            friendPage.getByRole('button', { name: 'Set active' })
        ).toBeVisible();
        await expect(friendPage).not.toHaveURL(new RegExp(routine.id));

        // The sender watches it from "Shared with me".
        await page.goto('/routines/shared');
        await expect(
            page.getByRole('heading', { name: 'Gus Receiver' })
        ).toBeVisible();
        await expect(
            page.getByRole('link', { name: /Gift plan/ })
        ).toBeVisible();
    });

    test('unknown email and sending to yourself are refused', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Nowhere');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.menu('Send routine');
        const dialog = page.getByRole('dialog', { name: 'Send routine' });
        const email = dialog.getByRole('textbox', { name: "User's account" });

        await email.fill('ghost@example.test');
        await dialog.getByRole('button', { name: 'Search' }).click();
        await expect(dialog.getByRole('alert')).toHaveText(
            'No account uses that email'
        );

        await email.fill(user.email);
        await dialog.getByRole('button', { name: 'Search' }).click();
        await expect(dialog.getByRole('alert')).toHaveText(
            "You can't send the routine to yourself"
        );
        await expect(
            dialog.getByRole('button', { name: 'Send routine' })
        ).toBeDisabled();
    });

    test('a declined routine never arrives', async ({
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Unwanted');
        const friend = await newUser();
        await sql(
            `insert into "RoutineRequest" ("id","kind","routineId","recipientId") values ($1,'send',$2,$3)`,
            [randomUUID(), routine.id, friend.id]
        );
        const friendPage = await pageAs(friend);
        await friendPage.goto('/routines/requests');
        await expect(
            friendPage.getByText('Wants to send you Unwanted')
        ).toBeVisible();
        await friendPage.getByRole('button', { name: 'Decline' }).click();
        await expect(friendPage.getByText('Nothing waiting')).toBeVisible();
        await friendPage.goto('/routines');
        await expect(
            friendPage.getByText('You have no routines yet.')
        ).toBeVisible();
    });

    test('a workout is sent to the workouts inbox', async ({
        page,
        user,
        newUser,
        pageAs,
    }) => {
        const workout = await seedCompleteWorkout(user.id, 'Gift workout');
        const friend = await newUser('Hal Lifter');
        const view = new RoutinePage(page);
        await view.goto(workout.id, 'workouts');
        await view.menu('Send workout');
        const dialog = page.getByRole('dialog', { name: 'Send workout' });
        // Nobody joins a workout: no membership box.
        await expect(dialog.getByRole('checkbox')).toHaveCount(0);
        await dialog
            .getByRole('textbox', { name: "User's account" })
            .fill(friend.email);
        await dialog.getByRole('button', { name: 'Search' }).click();
        await dialog.getByRole('button', { name: 'Send workout' }).click();
        await expect(toast(page, 'Workout sent to Hal Lifter')).toBeVisible();

        const friendPage = await pageAs(friend);
        await friendPage.goto('/workouts');
        await friendPage.getByRole('link', { name: 'Requests (1)' }).click();
        await expect(friendPage).toHaveURL('/workouts/requests');
        await expect(
            friendPage.getByText('Wants to send you the workout Gift workout')
        ).toBeVisible();
        await friendPage.getByRole('button', { name: 'Accept' }).click();
        await expect(
            toast(friendPage, 'Gift workout is now in your workouts')
        ).toBeVisible();
        await friendPage.goto('/workouts');
        await expect(
            friendPage.getByRole('link', { name: /Gift workout/ })
        ).toBeVisible();
    });
});
