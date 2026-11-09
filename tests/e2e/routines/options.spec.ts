import { expect, test, toast } from '../fixtures';
import { RoutinePage } from '../pages/routine-page';
import { seedCompleteRoutine, seedRoutine } from '../support/seed';

test.describe('routine options', () => {
    test('rename: the save waits for a change, and the name persists', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Old name');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.menu('Rename routine');

        const dialog = page.getByRole('dialog', { name: 'Rename routine' });
        const name = dialog.getByRole('textbox', { name: 'Name' });
        const save = dialog.getByRole('button', { name: 'Save' });
        await expect(name).toHaveValue('Old name');
        await expect(save).toBeDisabled();
        await name.fill('   ');
        await expect(save).toBeDisabled();
        await name.fill('New name');
        await save.click();

        await expect(toast(page, 'Name changed')).toBeVisible();
        await expect(view.heading).toHaveText('New name');
        await page.goto('/routines');
        await expect(
            page.getByRole('link', { name: /New name/ })
        ).toBeVisible();
    });

    test('duration: refuses weeks out of range and saves a valid one', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Block');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.menu('Change duration');

        const dialog = page.getByRole('dialog', { name: 'Change duration' });
        const weeks = dialog.getByRole('spinbutton', {
            name: 'Duration in weeks',
        });
        const save = dialog.getByRole('button', { name: 'Save' });
        await expect(weeks).toHaveValue('4');
        for (const bad of ['0', '53', '4']) {
            await weeks.fill(bad);
            await expect(save).toBeDisabled();
        }
        await weeks.fill('12');
        await save.click();

        await expect(toast(page, 'Duration changed')).toBeVisible();
        await expect(
            page.getByText('12 weeks · 2 days per week')
        ).toBeVisible();
        await page.reload();
        await expect(
            page.getByText('12 weeks · 2 days per week')
        ).toBeVisible();
    });

    test('an open-ended routine has no duration to change', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Open', {
            weeks: null,
        });
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.options.click();
        await expect(view.entry('Rename routine')).toBeVisible();
        await expect(view.entry('Change duration')).toHaveCount(0);
    });

    test('visibility: public shows the share button, private hides it', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Visible');
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        const share = page.getByRole('button', { name: 'Share' });
        await expect(share).toHaveCount(0);

        await view.menu('Make public');
        await expect(toast(page, 'The routine is now public')).toBeVisible();
        await expect(share).toBeVisible();

        await view.menu('Make private');
        await expect(toast(page, 'The routine is now private')).toBeVisible();
        await expect(share).toHaveCount(0);
    });

    test('share copies the routine link', async ({
        page,
        user,
        browserName,
    }) => {
        test.skip(
            browserName !== 'chromium',
            'clipboard permissions are Chromium-only'
        );
        await page
            .context()
            .grantPermissions(['clipboard-read', 'clipboard-write']);
        const routine = await seedCompleteRoutine(user.id, 'Shared link', {
            isPublic: true,
        });
        await page.goto(`/routines/${routine.id}`);
        await page.getByRole('button', { name: 'Share' }).click();
        await expect(
            page.getByRole('button', { name: 'Link copied' })
        ).toBeVisible();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
            page.url()
        );
    });

    test('duplicate asks, then opens a fresh private copy', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Original', {
            isActive: true,
        });
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.menu('Duplicate routine');
        await expect(view.dialog).toContainText(
            'The copy starts from scratch, with no progress.'
        );
        await view.confirm('Duplicate routine');

        await expect(toast(page, 'Copy of Original created')).toBeVisible();
        await expect(page).not.toHaveURL(new RegExp(routine.id));
        await expect(view.heading).toHaveText('Original (copy)');
        // Same plan, none of the progress: not active.
        await expect(
            page.getByRole('button', { name: 'Set active' })
        ).toBeVisible();
        await expect(page.getByRole('tab')).toHaveCount(2);
    });

    test('delete asks, can be cancelled, and removes the routine', async ({
        page,
        user,
    }) => {
        const routine = await seedCompleteRoutine(user.id, 'Doomed');
        const view = new RoutinePage(page);
        await view.goto(routine.id);

        await view.menu('Delete routine');
        await expect(view.dialog).toContainText('Delete the routine Doomed?');
        await view.confirm('Cancel');
        await expect(view.heading).toHaveText('Doomed');

        await view.menu('Delete routine');
        await view.confirm('Delete');
        await expect(page).toHaveURL('/routines');
        await expect(page.getByText('You have no routines yet.')).toBeVisible();

        await page.goto(`/routines/${routine.id}`);
        await expect(
            page.getByText('This page could not be found.')
        ).toBeVisible();
    });

    test('set active and deactivate', async ({ page, user }) => {
        const routine = await seedCompleteRoutine(user.id, 'Toggle');
        await page.goto(`/routines/${routine.id}`);

        await page.getByRole('button', { name: 'Set active' }).click();
        await expect(
            toast(page, 'Toggle is now your active routine')
        ).toBeVisible();
        await page.getByRole('button', { name: 'Deactivate' }).click();
        await expect(
            toast(page, 'Toggle is no longer your active routine')
        ).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Set active' })
        ).toBeVisible();

        await page.goto('/');
        await expect(page.getByText('Nothing in progress')).toBeVisible();
    });

    test('only one routine is active at a time', async ({ page, user }) => {
        const first = await seedCompleteRoutine(user.id, 'First', {
            isActive: true,
        });
        const second = await seedCompleteRoutine(user.id, 'Second');
        await page.goto(`/routines/${second.id}`);
        await page.getByRole('button', { name: 'Set active' }).click();
        await expect(
            toast(page, 'Second is now your active routine')
        ).toBeVisible();

        await page.goto(`/routines/${first.id}`);
        await expect(
            page.getByRole('button', { name: 'Set active' })
        ).toBeVisible();
    });

    test('export downloads the plan as an .xlsx', async ({ page, user }) => {
        const routine = await seedCompleteRoutine(user.id, 'Spreadsheet');
        const view = new RoutinePage(page);
        await view.goto(routine.id);

        const download = page.waitForEvent('download');
        await view.menu('Export to Excel');
        expect((await download).url()).toMatch(
            new RegExp(`/routines/${routine.id}/export$`)
        );

        // The name travels as RFC 5987 `filename*` only. Chromium honours it;
        // Playwright's WebKit does not and saves "export", so the header
        // itself is what is checked.
        const response = await page.request.get(
            `/routines/${routine.id}/export`
        );
        expect(response.headers()['content-type']).toContain('spreadsheetml');
        expect(response.headers()['content-disposition']).toContain(
            "filename*=UTF-8''Spreadsheet.xlsx"
        );
        // An .xlsx is a zip: it starts with "PK".
        expect((await response.body()).subarray(0, 2).toString()).toBe('PK');
    });

    test('an incomplete routine offers no export or send, and the route refuses it', async ({
        page,
        user,
    }) => {
        const routine = await seedRoutine(user.id, {
            name: 'Draft',
            days: [{ name: 'Day', exercises: [{ name: 'Lift', sets: [] }] }],
        });
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await view.options.click();
        await expect(view.entry('Export to Excel')).toHaveCount(0);
        await expect(view.entry('Send routine')).toHaveCount(0);

        const response = await page.request.get(
            `/routines/${routine.id}/export`
        );
        expect(response.status()).toBe(409);
    });

    test('a finished routine is read-only', async ({ page, user }) => {
        // Two days for four weeks: eight days walked, nothing left.
        const routine = await seedCompleteRoutine(user.id, 'Done and dusted', {
            cursor: 8,
        });
        const view = new RoutinePage(page);
        await view.goto(routine.id);
        await expect(page.getByText('Finished', { exact: true })).toBeVisible();
        await view.options.click();
        await expect(view.entry('Edit')).toHaveCount(0);
        await expect(view.entry('Rename routine')).toHaveCount(0);
        await expect(view.entry('Change duration')).toHaveCount(0);
        await expect(view.entry('Duplicate routine')).toBeVisible();
    });
});
