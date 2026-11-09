import {
    expect,
    test as base,
    type APIRequestContext,
    type Locator,
    type Page,
} from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { LandingPage } from '../pages/landing-page';

export type TestUser = {
    id: string;
    name: string;
    email: string;
    password: string;
};

/**
 * A brand-new account, through BetterAuth's own endpoint: every test gets
 * people nobody else touches, so tests never share data or depend on order.
 * Throwaway credentials, generated per run, in a disposable database.
 */
async function signUp(
    request: APIRequestContext,
    name?: string
): Promise<TestUser> {
    const tag = randomUUID().slice(0, 8);
    const user = {
        name: name ?? `Athlete ${tag}`,
        email: `e2e-${tag}@example.test`,
        password: `pw-${randomUUID()}`,
    };
    const response = await request.post('/api/auth/sign-up/email', {
        data: user,
    });
    if (!response.ok())
        throw new Error(
            `sign-up ${response.status()}: ${await response.text()}`
        );
    const { user: created } = await response.json();
    return { ...user, id: created.id };
}

type Fixtures = {
    /** The signed-out home page, already open. */
    landing: LandingPage;
    /** A fresh account, signed in on `page`. */
    user: TestUser;
    /** Another fresh account, signed in nowhere. */
    newUser: (name?: string) => Promise<TestUser>;
    /** A separate browser session signed in as `user`: the other side of a
        share, a follow, an invitation. */
    pageAs: (user: TestUser) => Promise<Page>;
};

/**
 * A client address of its own. A production build rate-limits sign-ups and
 * sign-ins per IP, and every test comes from 127.0.0.1: told apart by
 * X-Forwarded-For (what BetterAuth reads, as behind any proxy), each test is a
 * different person instead of one very busy one.
 */
export const clientIp = () =>
    `10.${[0, 0, 0].map(() => Math.floor(Math.random() * 254) + 1).join('.')}`;
const asClient = () => ({ 'x-forwarded-for': clientIp() });

export const test = base.extend<Fixtures>({
    extraHTTPHeaders: async ({}, provide) => {
        await provide(asClient());
    },

    landing: async ({ page }, provide) => {
        const landing = new LandingPage(page);
        await landing.goto();
        await provide(landing);
    },

    user: async ({ page }, provide) => {
        // page.request shares the page's cookies: the session lands on it.
        await provide(await signUp(page.request));
    },

    newUser: async ({ playwright, baseURL }, provide) => {
        await provide(async (name) => {
            const request = await playwright.request.newContext({
                baseURL,
                extraHTTPHeaders: asClient(),
            });
            try {
                return await signUp(request, name);
            } finally {
                await request.dispose();
            }
        });
    },

    pageAs: async ({ browser, baseURL, locale }, provide) => {
        const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
        await provide(async (user) => {
            const context = await browser.newContext({
                baseURL,
                locale,
                extraHTTPHeaders: asClient(),
            });
            contexts.push(context);
            const response = await context.request.post(
                '/api/auth/sign-in/email',
                { data: { email: user.email, password: user.password } }
            );
            if (!response.ok()) throw new Error(`sign-in ${response.status()}`);
            return context.newPage();
        });
        await Promise.all(contexts.map((context) => context.close()));
    },
});

export { expect } from '@playwright/test';

/** Native constraint validation: what blocks a submit before any JS runs. */
export function isValid(field: Locator) {
    return field.evaluate((el: HTMLInputElement) => el.validity.valid);
}

/**
 * Runs `act` until `ready` turns enabled. A field typed into before React has
 * hydrated keeps its text on screen but never reaches the component's state,
 * so the form stays dead — WebKit on a production build is quick enough to get
 * there first. Repeating the input once React is listening is what a person
 * would do; no fixed wait involved.
 */
export async function untilReady(act: () => Promise<void>, ready: Locator) {
    await expect(async () => {
        await act();
        await expect(ready).toBeEnabled({ timeout: 1000 });
    }).toPass();
}

/**
 * Clears a field, then types. React only fires onChange for a value that
 * differs from the one it last saw — so text typed before hydration, typed
 * again, would go unnoticed for good.
 */
export async function retype(field: Locator, value: string) {
    await field.fill('');
    await field.fill(value);
}

/** A toast: errors are alerts, everything else a status. */
export const toast = (page: Page, text: string | RegExp) =>
    page
        .getByRole('status')
        .or(page.getByRole('alert'))
        .filter({ hasText: text });
