import { getT } from '@/i18n/server';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { prisma } from './db';

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: { enabled: true },
    // Both providers hand back a verified email, which is what BetterAuth needs
    // to link a social sign-in to an account that already exists under that
    // address — so signing up by email and later using Google lands on one user.
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
    user: { deleteUser: { enabled: true } },
    plugins: [nextCookies()],
});

/** The current request's user, or null. */
export async function currentUser() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
}

/** Same as currentUser but throws: for server actions. */
export async function requireUser() {
    const user = await currentUser();
    if (!user) throw new Error((await getT())('error.notSignedIn'));
    return user;
}
