import { Footer, REPO_URL } from '@/components/chrome/footer';
import { DOCS } from '@/lib/legal';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import pkg from '../../../../package.json';

// A server component: it reads the locale off the request, which no test has.
vi.mock('@/i18n/server', async () => {
    const { createT, dictionaries } = await import('@/i18n/config');
    return { getT: async () => createT(dictionaries.en) };
});

describe('Footer', () => {
    it('links every legal document the route serves', async () => {
        render(await Footer());

        const links = screen.getAllByRole('link', { name: /policy|Terms/ });
        expect(links.map((link) => link.getAttribute('href'))).toEqual(
            Object.keys(DOCS).map((slug) => `/legal/${slug}`)
        );
    });

    // Leaving the app is what target="_blank" says, and rel="noreferrer" is
    // what stops the new tab from reaching back into this one.
    it('opens the project links in a new tab, safely', async () => {
        render(await Footer());

        for (const name of ['Source code', 'GitHub profile']) {
            const link = screen.getByRole('link', { name });
            expect(link).toHaveAttribute('target', '_blank');
            expect(link).toHaveAttribute('rel', 'noreferrer');
        }
        expect(
            screen.getByRole('link', { name: 'Source code' })
        ).toHaveAttribute('href', REPO_URL);
    });

    it('offers contact as a mail link, in the same tab', async () => {
        render(await Footer());

        const link = screen.getByRole('link', { name: 'Contact' });
        expect(link.getAttribute('href')).toMatch(/^mailto:.+@.+/);
        expect(link).not.toHaveAttribute('target');
    });

    // The version is the only thing on screen that says which build this is,
    // so it comes from the manifest rather than from a string kept in step.
    it('shows the shipped version', async () => {
        render(await Footer());
        expect(screen.getByText(`v${pkg.version}`)).toBeInTheDocument();
    });

    it('dates the notice by the year it is read in', async () => {
        render(await Footer());
        expect(
            screen.getByText(
                new RegExp(`© ${new Date().getFullYear()} Krafitt`)
            )
        ).toBeInTheDocument();
    });

    it('names both of its navigations, since there are two', async () => {
        render(await Footer());
        expect(
            screen.getByRole('navigation', { name: 'Project links' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('navigation', { name: 'Legal' })
        ).toBeInTheDocument();
    });
});
