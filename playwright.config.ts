import { defineConfig, devices } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import {
    assertDisposable,
    LOCAL_PG_PORT,
    localDatabaseUrl,
} from './tests/e2e/support/database';

const CI = !!process.env.CI;
// Not 3000: the suite must never land on a dev server of yours, which talks to
// the real database.
const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

// Resolved once in the runner; the workers inherit the variables. Given a
// database (CI's service, or your own local one) the suite uses it; otherwise
// it starts a throwaway Postgres of its own.
const ownDatabase = !process.env.E2E_DATABASE_URL;
process.env.E2E_DATABASE_URL ??= localDatabaseUrl();
process.env.E2E_AUTH_SECRET ??= randomBytes(32).toString('base64');
assertDisposable(process.env.E2E_DATABASE_URL);

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: CI,
    retries: CI ? 2 : 0,
    workers: CI ? 2 : undefined,
    reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'html',

    use: {
        baseURL,
        // The app picks its language from Accept-Language: pin it so the
        // assertions on English copy hold on any machine.
        locale: 'en-US',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        { name: 'setup', testMatch: /db\.setup\.ts/ },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            dependencies: ['setup'],
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            dependencies: ['setup'],
        },
    ],

    webServer: [
        ...(ownDatabase
            ? [
                  {
                      command: 'node tests/e2e/support/postgres.mjs',
                      port: LOCAL_PG_PORT,
                      // One left behind by an interrupted run is just as good.
                      reuseExistingServer: true,
                      timeout: 120_000,
                  },
              ]
            : []),
        {
            // A production build, as Next recommends testing. E2E_DEV=1 swaps
            // in `next dev` for quicker iteration (stop your own dev server
            // first: Next allows one per project).
            command: process.env.E2E_DEV
                ? `pnpm dev -p ${PORT}`
                : `pnpm build && pnpm start -p ${PORT}`,
            url: baseURL,
            reuseExistingServer: false,
            timeout: 300_000,
            env: {
                DATABASE_URL: process.env.E2E_DATABASE_URL,
                DIRECT_URL: process.env.E2E_DATABASE_URL,
                BETTER_AUTH_URL: baseURL,
                BETTER_AUTH_SECRET: process.env.E2E_AUTH_SECRET,
                // The fixtures tell clients apart by X-Forwarded-For: pinned
                // here so a proxy setting in your .env never changes that.
                AUTH_IP_HEADER: 'x-forwarded-for',
                AUTH_TRUSTED_PROXIES: '',
            },
        },
    ],
});
