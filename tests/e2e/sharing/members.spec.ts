import { randomUUID } from 'node:crypto';
import { expect, retype, test, toast, untilReady } from '../fixtures';
import { RoutinePage } from '../pages/routine-page';
import { seedCompleteRoutine, seedMember, sql } from '../support/seed';

const askToJoin = (routineId: string, recipientId: string) =>
    sql(
        `insert into "RoutineRequest" ("id","kind","routineId","recipientId") values ($1,'member',$2,$3)`,
        [randomUUID(), routineId, recipientId]
    );

test.describe('routine members', () => {
    test('invite by email, accept, then read the plan and its history', async ({
        page,
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Team plan', {
            isActive: true,
        });
        const friend = await newUser('Bea Member');

        // Owner: the people page, through the options menu.
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.menu('People');
        await expect(page).toHaveURL(`/routines/${routine.id}/people`);
        await expect(page.getByText('Nobody else is in')).toBeVisible();

        const email = page.getByRole('textbox', { name: 'Search people' });
        await email.fill(friend.email.toUpperCase());
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(
            page.getByRole('img', { name: 'Person found' })
        ).toBeVisible();
        await page.getByRole('button', { name: 'Add' }).click();
        await expect(toast(page, 'Request sent to Bea Member')).toBeVisible();
        const row = page
            .getByRole('listitem')
            .filter({ hasText: 'Bea Member' });
        await expect(row).toContainText('Pending');

        // Asking twice changes nothing.
        await email.fill(friend.email);
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(
            page.getByRole('status').filter({
                hasText: 'Bea Member already has an invitation waiting',
            })
        ).toBeVisible();

        // Friend: the request waits in their inbox.
        const friendPage = await pageAs(friend);
        await friendPage.goto('/routines');
        await friendPage.getByRole('link', { name: 'Requests (1)' }).click();
        await expect(
            friendPage.getByText(
                'Wants to add you to Team plan so you can see it'
            )
        ).toBeVisible();
        await friendPage.getByRole('button', { name: 'Accept' }).click();
        await expect(
            toast(friendPage, 'You are now a member of Team plan')
        ).toBeVisible();
        await expect(friendPage.getByText('Nothing waiting')).toBeVisible();

        await friendPage.goto('/routines/shared');
        await expect(
            friendPage.getByRole('heading', { name: user.name })
        ).toBeVisible();
        await friendPage.getByRole('link', { name: /Team plan/ }).click();
        await expect(
            friendPage.getByRole('link', { name: `Routine by ${user.name}` })
        ).toBeVisible();
        await expect(
            friendPage.getByRole('link', { name: 'History' })
        ).toBeVisible();

        // A member reads; deleting and sharing stay with the owner.
        const friendView = new RoutinePage(friendPage);
        await friendView.options.click();
        await expect(friendView.entry('Leave routine')).toBeVisible();
        await expect(friendView.entry('Save routine')).toBeVisible();
        await expect(friendView.entry('Delete routine')).toHaveCount(0);
        await expect(friendView.entry('Rename routine')).toHaveCount(0);
        await expect(friendView.entry('Make public')).toHaveCount(0);

        // Owner sees them in, no longer pending.
        await page.reload();
        await expect(row).not.toContainText('Pending');
    });

    test('search errors: unknown email, and your own', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Solo');
        await page.goto(`/routines/${routine.id}/people`);
        const email = page.getByRole('textbox', { name: 'Search people' });

        await untilReady(
            () => retype(email, 'nobody-here@example.test'),
            page.getByRole('button', { name: 'Search' })
        );
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(page.getByText('No account uses that email')).toHaveRole(
            'alert'
        );

        await email.fill(user.email);
        await page.getByRole('button', { name: 'Search' }).click();
        await expect(
            page.getByText('This routine is already yours')
        ).toHaveRole('alert');
    });

    test('the owner takes a member out, who then loses access', async ({
        page,
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Closed circle');
        const friend = await newUser('Cai Former');
        await seedMember(routine.id, friend.id);

        await page.goto(`/routines/${routine.id}/people`);
        await page.getByRole('button', { name: 'Remove Cai Former' }).click();
        const dialog = page.getByRole('dialog', { name: 'Remove person' });
        await expect(dialog).toContainText(
            'Remove Cai Former from this routine?'
        );
        await dialog.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('Nobody else is in')).toBeVisible();

        const friendPage = await pageAs(friend);
        await friendPage.goto(`/routines/${routine.id}`);
        await expect(
            friendPage.getByText('This page could not be found.')
        ).toBeVisible();
    });

    test('a member can leave on their own', async ({
        page,
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Door open');
        const friend = await newUser('Dee Leaver');
        await seedMember(routine.id, friend.id);

        const friendPage = await pageAs(friend);
        const view = new RoutinePage(friendPage);
        await view.goto(routine.id);
        await view.menu('Leave routine');
        await expect(view.dialog).toContainText('You will lose access to it');
        await view.confirm('Leave routine');
        await expect(friendPage).toHaveURL('/routines/shared');
        await expect(friendPage.getByText('Nothing shared yet')).toBeVisible();

        await page.goto(`/routines/${routine.id}/people`);
        await expect(page.getByText('Nobody else is in')).toBeVisible();
    });

    test('an invitation can be declined, or taken back by the owner', async ({
        page,
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Maybe later');
        const declining = await newUser('Eve Declines');
        const waiting = await newUser('Fay Waits');
        await askToJoin(routine.id, declining.id);
        await askToJoin(routine.id, waiting.id);

        const declinePage = await pageAs(declining);
        await declinePage.goto('/routines/requests');
        await declinePage.getByRole('button', { name: 'Decline' }).click();
        await expect(declinePage.getByText('Nothing waiting')).toBeVisible();

        await page.goto(`/routines/${routine.id}/people`);
        await expect(page.getByText('Eve Declines')).toHaveCount(0);
        await page.getByRole('button', { name: 'Remove Fay Waits' }).click();
        const dialog = page.getByRole('dialog', { name: 'Remove person' });
        await expect(dialog).toContainText(
            'Cancel the invitation to Fay Waits?'
        );
        await dialog.getByRole('button', { name: 'Delete' }).click();
        await expect(page.getByText('Nobody else is in')).toBeVisible();

        const waitingPage = await pageAs(waiting);
        await waitingPage.goto('/routines/requests');
        await expect(waitingPage.getByText('Nothing waiting')).toBeVisible();
    });

    test('the people page is the owner’s alone', async ({
        user,
        newUser,
        pageAs,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Private list');
        const member = await newUser();
        await seedMember(routine.id, member.id);
        const memberPage = await pageAs(member);
        await memberPage.goto(`/routines/${routine.id}/people`);
        await expect(
            memberPage.getByText('This page could not be found.')
        ).toBeVisible();
    });
});
