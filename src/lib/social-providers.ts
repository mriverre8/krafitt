/**
 * The providers the auth card offers, and the mark each one is drawn with.
 * One button does both sign-up and sign-in: the provider owns the account, so
 * there is nothing for the login/signup tabs above it to switch between.
 *
 * The marks are files in `public/` rather than paths inlined into a component:
 * they are the providers' own brand assets, and each set of terms wants its
 * mark used as shipped rather than redrawn.
 */

type SocialProvider = {
    id: 'google' | 'github';
    name: string;
    /** The mark on a light background. */
    mark: string;
    /** The same mark for dark mode, where a single-colour one would otherwise
        disappear into the button behind it. Absent when one file reads on both. */
    markDark?: string;
};

export const SOCIAL_PROVIDERS: readonly SocialProvider[] = [
    {
        id: 'google',
        name: 'Google',
        // The four-colour G carries its own contrast, so it needs no twin.
        mark: '/google_favicon_2025.svg',
    },
    {
        id: 'github',
        name: 'GitHub',
        mark: '/github-invertocat-black.svg',
        markDark: '/github-invertocat_white.svg',
    },
];
