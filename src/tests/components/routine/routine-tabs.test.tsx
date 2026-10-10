import { RoutineTabs } from '@/components/routine/routine-tabs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// A server component: it reads the locale off the request, which no test has.
vi.mock('@/i18n/server', async () => {
    const { createT, dictionaries } = await import('@/i18n/config');
    return { getT: async () => createT(dictionaries.en) };
});

const tabs = async (requests?: number) =>
    render(
        await RoutineTabs({
            current: '/routines',
            requests,
        })
    );

describe('RoutineTabs', () => {
    it('has no requests tab while nothing is waiting', async () => {
        await tabs(0);

        expect(screen.getAllByRole('link')).toHaveLength(2);
    });

    // On a phone only the icon and the count show, so the link carries its
    // whole name for whoever cannot see it.
    it('shows the requests tab with its count once something is waiting', async () => {
        await tabs(3);

        const link = screen.getByRole('link', { name: 'Requests (3)' });
        expect(link).toHaveAttribute('href', '/routines/requests');
        expect(link).toHaveTextContent('3');
    });
});
