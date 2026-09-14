import { Footer } from '@/components/chrome/footer';
import { CONTACT_EMAIL, PROFILE_URL, REPO_URL } from '@/lib/site';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import pkg from '../../../../package.json';

// A server component, so the locale comes from the request rather than from a
// provider. Nothing here is set, which is English.
vi.mock('next/headers', () => ({
    cookies: async () => ({ get: () => undefined }),
    headers: async () => ({ get: () => null }),
}));

describe('Footer', () => {
    // The only place the running version is on screen: a bug report that names
    // one is worth more than one that does not.
    it('stamps the version that is running', async () => {
        render(await Footer());
        expect(screen.getByText(`v${pkg.version}`)).toBeInTheDocument();
    });

    // The routes these three point at are read as files named after them, so a
    // broken href here is a 404 on the pages nobody visits until they have to.
    it('links every legal page', async () => {
        render(await Footer());
        const cases = [
            ['Privacy policy', '/legal/privacy'],
            ['Terms of service', '/legal/terms'],
            ['Cookie policy', '/legal/cookies'],
        ];
        for (const [name, href] of cases) {
            expect(screen.getByRole('link', { name })).toHaveAttribute(
                'href',
                href
            );
        }
    });

    it('opens the project links in a new tab, without handing it the opener', async () => {
        render(await Footer());
        const cases = [
            ['Source code', REPO_URL],
            ['GitHub profile', PROFILE_URL],
        ];
        for (const [name, href] of cases) {
            const link = screen.getByRole('link', { name });
            expect(link).toHaveAttribute('href', href);
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noreferrer');
        }
        expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute(
            'href',
            `mailto:${CONTACT_EMAIL}`
        );
    });

    // Two navs in one footer: unlabelled they are two anonymous landmarks.
    it('tells its two groups of links apart', async () => {
        render(await Footer());
        expect(
            screen.getByRole('navigation', { name: 'Project links' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('navigation', { name: 'Legal' })
        ).toBeInTheDocument();
    });
});
