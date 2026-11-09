// A real, local, throwaway Postgres for the e2e suite, started by Playwright as
// a webServer and stopped with the run. Data lives under node_modules/.cache,
// never anywhere near the app's own database. CI brings its own service and
// sets E2E_DATABASE_URL instead, so this never runs there.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const port = Number(process.env.E2E_PG_PORT ?? 54329);
const databaseDir = join(
    process.cwd(),
    'node_modules',
    '.cache',
    'krafitt-e2e-postgres'
);

const pg = new EmbeddedPostgres({
    databaseDir,
    port,
    user: 'postgres',
    password: 'postgres',
    persistent: true,
    onLog: () => {},
});

if (!existsSync(join(databaseDir, 'PG_VERSION'))) await pg.initialise();
await pg.start();
await pg.createDatabase('krafitt_e2e').catch(() => {}); // already there
console.log(`e2e postgres listening on ${port}`);

const stop = async () => {
    await pg.stop().catch(() => {});
    process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
