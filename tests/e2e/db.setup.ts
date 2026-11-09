import { test as setup } from '@playwright/test';
import { syncSchema } from './support/database';

// Tests make their own users, so none depends on another's data or on the
// order they run in; all a run needs is the current schema.
setup('sync the e2e database schema', () => {
    syncSchema(process.env.E2E_DATABASE_URL!);
});
