import { execFileSync } from 'node:child_process';

const PRISMA = 'node_modules/prisma/build/index.js';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export const LOCAL_PG_PORT = Number(process.env.E2E_PG_PORT ?? 54329);

/** The database `support/postgres.mjs` serves when none is given. */
export const localDatabaseUrl = () =>
    `postgresql://postgres:postgres@localhost:${LOCAL_PG_PORT}/krafitt_e2e`;

/** The suite writes freely to the database it is given: never a real one. */
export function assertDisposable(url: string) {
    const host = new URL(url).hostname;
    if (!LOCAL_HOSTS.has(host)) {
        throw new Error(
            `E2E refuses to run against "${host}": E2E_DATABASE_URL must point at a local, disposable database.`
        );
    }
}

/**
 * Brings the schema up to date (migrations are not committed). Nothing is
 * wiped: every test makes its own users, so rows left by earlier runs are never
 * seen. If a schema change would lose data this fails instead — delete
 * node_modules/.cache/krafitt-e2e-postgres to start over.
 */
export function syncSchema(url: string) {
    assertDisposable(url);
    execFileSync(process.execPath, [PRISMA, 'db', 'push'], {
        // Both: prisma.config prefers DIRECT_URL, and would otherwise read
        // the real one from .env.
        env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
        stdio: 'pipe',
    });
}
