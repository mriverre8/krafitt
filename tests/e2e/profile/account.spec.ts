import { expect, test } from '../fixtures';

// A 1×1 PNG: the smallest picture the browser will decode.
const PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
);

test.describe('account settings (signed in)', () => {
    test.beforeEach(async ({ page, user }) => {
        await page.goto('/');
        const menu = page.getByRole('button', { name: 'Menu' });
        await expect(menu).toContainText(user.name);
        await menu.click();
        await page.getByRole('button', { name: 'Settings' }).click();
        await expect(
            page.getByRole('dialog', { name: 'Settings' })
        ).toBeVisible();
    });

    test('change the username', async ({ page }) => {
        const dialog = page.getByRole('dialog', { name: 'Settings' });
        const username = dialog.getByRole('textbox', { name: 'Username' });
        const save = dialog.getByRole('button', { name: 'Save' });
        await expect(save).toBeDisabled();
        await username.fill('Renamed Athlete');
        await save.click();
        await expect(save).toBeDisabled();
        await page.keyboard.press('Escape');

        await expect(page.getByRole('button', { name: 'Menu' })).toContainText(
            'Renamed Athlete'
        );
        await page.reload();
        await expect(page.getByRole('button', { name: 'Menu' })).toContainText(
            'Renamed Athlete'
        );
    });

    test('upload and remove a profile picture', async ({ page }) => {
        const dialog = page.getByRole('dialog', { name: 'Settings' });
        await dialog.locator('input[type="file"]').setInputFiles({
            name: 'me.png',
            mimeType: 'image/png',
            buffer: PIXEL,
        });
        const remove = dialog.getByRole('button', { name: 'Remove picture' });
        await expect(remove).toBeVisible();

        // Persisted: after a reload the menu draws the picture (decorative,
        // so hidden from the accessibility tree) instead of the initials icon.
        await page.reload();
        await expect(
            page.getByRole('button', { name: 'Menu' }).locator('img')
        ).toHaveAttribute('src', /^data:image\//);

        await page.getByRole('button', { name: 'Menu' }).click();
        await page.getByRole('button', { name: 'Settings' }).click();
        await remove.click();
        await expect(remove).toHaveCount(0);
    });

    test('a file that is not an image is refused with a message', async ({
        page,
    }) => {
        const dialog = page.getByRole('dialog', { name: 'Settings' });
        await dialog.locator('input[type="file"]').setInputFiles({
            name: 'notes.png',
            mimeType: 'image/png',
            buffer: Buffer.from('this is not a picture'),
        });
        await expect(dialog.getByRole('alert')).toHaveText(
            'Could not read that image'
        );
        await expect(
            dialog.getByRole('button', { name: 'Remove picture' })
        ).toHaveCount(0);
    });

    test('delete the account: asks, then it is gone for good', async ({
        page,
        user,
    }) => {
        await page
            .getByRole('dialog', { name: 'Settings' })
            .getByRole('button', { name: 'Delete', exact: true })
            .click();
        const confirm = page.getByRole('dialog', { name: 'Delete account' });
        await expect(confirm).toContainText('This cannot be undone.');
        await confirm.getByRole('button', { name: 'Delete account' }).click();
        await expect(
            page.getByRole('link', { name: 'Start training' })
        ).toBeVisible();

        const response = await page.request.post('/api/auth/sign-in/email', {
            data: { email: user.email, password: user.password },
        });
        expect(response.ok()).toBe(false);
    });

    test('the language chosen here applies to the app pages', async ({
        page,
    }) => {
        await page
            .getByRole('dialog', { name: 'Settings' })
            .getByRole('button', { name: 'ca' })
            .click();
        await expect(
            page.getByRole('dialog', { name: 'Configuració' })
        ).toBeVisible();
        await page.goto('/routines');
        await expect(
            page.getByRole('heading', { level: 1, name: 'Rutines' })
        ).toBeVisible();
        await expect(page.getByText('Encara no tens rutines.')).toBeVisible();
    });
});
