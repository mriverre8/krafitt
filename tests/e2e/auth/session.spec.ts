import { randomUUID } from 'node:crypto';
import { clientIp, expect, test } from '../fixtures';
import { sql } from '../support/seed';

const idle = 'Nothing in progress';

test.describe('sign up', () => {
    test('creates the account and signs it in', async ({ landing, page }) => {
        await landing.signupTab.click();
        await landing.name.fill('New Athlete');
        await landing.email.fill(
            `e2e-${randomUUID().slice(0, 8)}@example.test`
        );
        await landing.password.fill(`pw-${randomUUID()}`);
        await landing.submit.click();

        await expect(page.getByText(idle)).toBeVisible();
        await page.getByRole('button', { name: 'Menu' }).click();
        await expect(
            page.getByRole('link', { name: 'Profile', exact: true })
        ).toBeVisible();
    });

    test('refuses an email that already has an account', async ({
        landing,
        newUser,
    }) => {
        const taken = await newUser();
        await landing.signupTab.click();
        await landing.name.fill('Copycat');
        await landing.email.fill(taken.email);
        await landing.password.fill(`pw-${randomUUID()}`);
        await landing.submit.click();

        await expect(landing.join.getByRole('alert')).toContainText(
            /already exists/i
        );
        await expect(landing.join).toBeVisible();
    });
});

test.describe('sign in', () => {
    test('with the right password', async ({ landing, newUser, page }) => {
        const athlete = await newUser();
        await landing.signIn(athlete.email, athlete.password);
        await expect(page.getByText(idle)).toBeVisible();
        await expect(page.getByRole('button', { name: 'Menu' })).toContainText(
            athlete.name
        );
    });

    test('with the wrong password shows the error and stays out', async ({
        landing,
        newUser,
        page,
    }) => {
        const athlete = await newUser();
        await landing.signIn(athlete.email, 'not-the-password');
        await expect(landing.join.getByRole('alert')).toContainText(
            /invalid email or password/i
        );
        await page.goto('/routines');
        await expect(page).toHaveURL('/');
    });

    test('a double click sends one request and locks the button', async ({
        landing,
        newUser,
        page,
    }) => {
        const athlete = await newUser();
        // Hold the request until the button has been checked.
        let release!: () => void;
        const held = new Promise<void>((resolve) => (release = resolve));
        let calls = 0;
        await page.route('**/api/auth/sign-in/email', async (route) => {
            calls++;
            await held;
            await route.continue();
        });

        await landing.email.fill(athlete.email);
        await landing.password.fill(athlete.password);
        await landing.submit.dblclick();
        await expect(landing.submit).toBeDisabled();
        release();

        await expect(page.getByText(idle)).toBeVisible();
        expect(calls).toBe(1);
    });
});

test.describe('brute-force protection', () => {
    // BetterAuth limits auth attempts per client in production builds only.
    test.skip(!!process.env.E2E_DEV, 'rate limiting is off under next dev');

    test('repeated failed sign-ins from one client are throttled', async ({
        playwright,
        baseURL,
        newUser,
    }) => {
        const victim = await newUser();
        const attacker = await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: { 'x-forwarded-for': clientIp() },
        });
        const statuses: number[] = [];
        for (let attempt = 0; attempt < 5; attempt++) {
            const response = await attacker.post('/api/auth/sign-in/email', {
                data: { email: victim.email, password: 'guess-' + attempt },
            });
            statuses.push(response.status());
        }
        await attacker.dispose();
        expect(statuses[0]).toBe(401);
        expect(statuses).toContain(429);
    });

    test('a forged X-Forwarded-For chain does not escape the limit', async ({
        playwright,
        baseURL,
        newUser,
    }) => {
        const victim = await newUser();
        const attacker = await playwright.request.newContext({ baseURL });
        const statuses: number[] = [];
        for (let attempt = 0; attempt < 5; attempt++) {
            // A new made-up address each time, in front of a fixed one: with
            // no trusted proxy configured the chain is not believed, so every
            // attempt lands in the same bucket instead of a fresh one.
            const response = await attacker.post('/api/auth/sign-in/email', {
                data: { email: victim.email, password: 'guess-' + attempt },
                headers: { 'x-forwarded-for': `${clientIp()}, 10.0.0.1` },
            });
            statuses.push(response.status());
        }
        await attacker.dispose();
        expect(statuses).toContain(429);
    });
});

test.describe('session', () => {
    test('sign out asks first, then ends the session', async ({
        page,
        user,
    }) => {
        await page.goto('/');
        await expect(page.getByRole('button', { name: 'Menu' })).toContainText(
            user.name
        );
        await page.getByRole('button', { name: 'Menu' }).click();
        await page.getByRole('button', { name: 'Sign out' }).click();

        const dialog = page.getByRole('dialog', { name: 'Sign out' });
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByText(idle)).toBeVisible();

        await page.getByRole('button', { name: 'Menu' }).click();
        await page.getByRole('button', { name: 'Sign out' }).click();
        await dialog.getByRole('button', { name: 'Sign out' }).click();
        await expect(
            page.getByRole('link', { name: 'Start training' })
        ).toBeVisible();

        await page.goto('/routines');
        await expect(page).toHaveURL('/');
    });

    test('an expired session is treated as signed out', async ({
        page,
        user,
    }) => {
        await page.goto('/routines');
        await expect(
            page.getByRole('heading', { name: 'Routines' })
        ).toBeVisible();

        await sql(
            `update "Session" set "expiresAt" = now() - interval '1 day' where "userId" = $1`,
            [user.id]
        );
        await page.goto('/routines');
        await expect(page).toHaveURL('/');
        await expect(
            page.getByRole('link', { name: 'Start training' })
        ).toBeVisible();
    });
});

test.describe('route protection (signed out)', () => {
    const pages = [
        '/routines',
        '/routines/all',
        '/routines/requests',
        '/routines/shared',
        '/routines/shared/all',
        '/routines/some-id',
        '/routines/some-id/people',
        '/routines/shared/some-id',
        '/workouts',
        '/workouts/all',
        '/workouts/requests',
        '/workouts/some-id',
        '/profile/some-id',
        '/profile/some-id/follows',
        '/progress/some-id',
    ];
    for (const path of pages) {
        test(`${path} redirects home`, async ({ page }) => {
            await page.goto(path);
            await expect(page).toHaveURL('/');
            await expect(
                page.getByRole('link', { name: 'Start training' })
            ).toBeVisible();
        });
    }

    for (const path of ['/routines/x/export', '/progress/x/export']) {
        test(`${path} answers 401`, async ({ request }) => {
            const response = await request.get(path);
            expect(response.status()).toBe(401);
        });
    }
});
