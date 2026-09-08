import { NavBar } from '@/components/nav-bar';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/auth-client', () => ({
    authClient: { signOut: vi.fn().mockResolvedValue(undefined) },
}));

/** The menu repeats the app links only below md, where the bar hides them. */
function openMenu(name: string) {
    fireEvent.click(screen.getByRole('button', { name }));
    return screen.getByLabelText(name, { selector: 'div' });
}

describe('NavBar', () => {
    it('hides the app links when signed out', () => {
        render(
            <NavBar
                userName={null}
                theme="dark"
            />
        );
        expect(
            screen.queryByRole('link', { name: 'Today' })
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Sign out' })
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Menu' })
        ).not.toBeInTheDocument();
    });

    it('shows the app links when signed in', () => {
        render(
            <NavBar
                userName="Ada"
                theme="dark"
            />
        );
        expect(screen.getByRole('link', { name: 'Today' })).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Routines' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Menu' })
        ).toBeInTheDocument();
    });

    it('keeps theme and language out of the bar until settings is opened', () => {
        render(
            <NavBar
                userName={null}
                theme="dark"
            />
        );
        expect(screen.queryByLabelText('Switch theme')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('group', { name: 'Language' })
        ).not.toBeInTheDocument();

        const menu = openMenu('Settings');
        expect(within(menu).getByLabelText('Switch theme')).toBeInTheDocument();
        expect(
            within(menu).getByRole('group', { name: 'Language' })
        ).toBeInTheDocument();
    });

    it('puts every signed-in option in the user menu', () => {
        render(
            <NavBar
                userName="Ada"
                theme="dark"
            />
        );
        const menu = openMenu('Menu');
        expect(within(menu).getByRole('link', { name: 'Today' })).toBeVisible();
        expect(
            within(menu).getByRole('link', { name: 'Routines' })
        ).toBeVisible();
        expect(
            within(menu).getByRole('button', { name: 'Settings' })
        ).toBeVisible();
        expect(
            within(menu).getByRole('button', { name: 'Sign out' })
        ).toBeVisible();
    });

    it('expands language and theme inside the user menu', () => {
        render(
            <NavBar
                userName="Ada"
                theme="dark"
            />
        );
        const menu = openMenu('Menu');
        expect(
            within(menu).queryByLabelText('Switch theme')
        ).not.toBeInTheDocument();

        fireEvent.click(within(menu).getByRole('button', { name: 'Settings' }));
        expect(within(menu).getByLabelText('Switch theme')).toBeInTheDocument();
        expect(
            within(menu).getByRole('group', { name: 'Language' })
        ).toBeInTheDocument();
    });

    it('offers a single settings control, never one per breakpoint', () => {
        render(
            <NavBar
                userName="Ada"
                theme="dark"
            />
        );
        const menu = openMenu('Menu');
        expect(
            within(menu).getAllByRole('button', { name: 'Settings' })
        ).toHaveLength(1);
    });
});
