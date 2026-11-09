import { expect, isValid, test } from '../fixtures';

test.describe('auth form', () => {
    test('switches between sign in and sign up', async ({ landing }) => {
        await expect(landing.loginTab).toHaveAttribute('aria-pressed', 'true');
        await expect(landing.name).toHaveCount(0);
        await expect(landing.submit).toHaveText("Let's go");

        await landing.signupTab.click();
        await expect(landing.signupTab).toHaveAttribute('aria-pressed', 'true');
        await expect(landing.name).toBeVisible();
        await expect(landing.submit).toHaveText('Create account');
    });

    test('blocks an empty submit', async ({ landing, page }) => {
        await landing.submit.click();
        expect(await isValid(landing.email)).toBe(false);
        expect(await isValid(landing.password)).toBe(false);
        await expect(page).toHaveURL('/');
    });

    test('validates email format and password length', async ({ landing }) => {
        await landing.email.fill('not-an-email');
        await landing.password.fill('short');
        expect(await isValid(landing.email)).toBe(false);
        expect(await isValid(landing.password)).toBe(false);

        await landing.email.fill('athlete@example.com');
        await landing.password.fill('long-enough');
        expect(await isValid(landing.email)).toBe(true);
        expect(await isValid(landing.password)).toBe(true);
    });

    test('sign up requires a name', async ({ landing }) => {
        await landing.signupTab.click();
        await landing.email.fill('athlete@example.com');
        await landing.password.fill('long-enough');
        await landing.submit.click();
        expect(await isValid(landing.name)).toBe(false);
    });
});
