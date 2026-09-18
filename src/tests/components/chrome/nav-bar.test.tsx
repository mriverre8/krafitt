import { NavBar } from '@/components/chrome/nav-bar';
import { useModalStore } from '@/store/modal';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/auth-client', () => ({
    authClient: { signOut: vi.fn().mockResolvedValue(undefined) },
}));

beforeEach(() => useModalStore.getState().close());

/** The menu repeats the app links only below md, where the bar hides them. */
function openMenu(name: string) {
    fireEvent.click(screen.getByRole('button', { name }));
    return screen.getByLabelText(name, { selector: 'div' });
}

describe('NavBar', () => {
    it('hides the app links when signed out', () => {
        render(
            <NavBar
                userId={null}
                userName={null}
                userImage={null}
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
                userId="u1"
                userName="Ada"
                userImage={null}
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

    // Theme and language live in a modal now: the bar only asks for it, and
    // what it asks for is the store's business, not the panel's.
    it('opens settings as a modal when signed out', () => {
        render(
            <NavBar
                userId={null}
                userName={null}
                userImage={null}
                theme="dark"
            />
        );
        expect(screen.queryByLabelText('Switch theme')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
        expect(useModalStore.getState().open).toEqual({
            kind: 'settings',
            props: { theme: 'dark' },
        });
    });

    it('puts every signed-in option in the user menu', () => {
        render(
            <NavBar
                userId="u1"
                userName="Ada"
                userImage={null}
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

    // On a phone this menu is the whole navigation, so the order is the spec:
    // where you go, then whose account it is, then what you do to it.
    it('lists the menu in navigation order', () => {
        render(
            <NavBar
                userId="u1"
                userName="Ada"
                userImage={null}
                theme="dark"
            />
        );
        const menu = openMenu('Menu');
        expect(
            Array.from(menu.querySelectorAll('a, button')).map(
                (item) => item.textContent
            )
        ).toEqual(['Today', 'Routines', 'Profile', 'Settings', 'Sign out']);
    });

    it('opens the settings modal from the user menu, and closes the menu', () => {
        render(
            <NavBar
                userId="u1"
                userName="Ada"
                userImage={null}
                theme="dark"
            />
        );
        const menu = openMenu('Menu');
        fireEvent.click(within(menu).getByRole('button', { name: 'Settings' }));

        expect(useModalStore.getState().open).toEqual({
            kind: 'settings',
            props: { theme: 'dark', userName: 'Ada', userImage: null },
        });
        expect(menu).not.toBeInTheDocument();
    });

    // Signing out is a click away from losing an unsaved workout, so it asks.
    it('confirms before signing out', async () => {
        const { authClient } = await import('@/lib/auth-client');
        render(
            <NavBar
                userId="u1"
                userName="Ada"
                userImage={null}
                theme="dark"
            />
        );
        const menu = openMenu('Menu');
        fireEvent.click(within(menu).getByRole('button', { name: 'Sign out' }));

        const open = useModalStore.getState().open;
        expect(open?.kind).toBe('confirm');
        expect(authClient.signOut).not.toHaveBeenCalled();

        (open?.props as { onConfirm: () => void }).onConfirm();
        expect(authClient.signOut).toHaveBeenCalled();
    });

    // The generic user icon is a placeholder for a picture, so a user who has
    // one sees themselves rather than the icon.
    it('wears the picture in the menu trigger when there is one', () => {
        const { rerender } = render(
            <NavBar
                userId="u1"
                userName="Ada"
                userImage={null}
                theme="dark"
            />
        );
        const trigger = () => screen.getByRole('button', { name: 'Menu' });
        expect(trigger().querySelector('img')).toBeNull();
        expect(trigger().querySelector('.lucide-user')).toBeInTheDocument();

        rerender(
            <NavBar
                userId="u1"
                userName="Ada"
                userImage="https://avatars.githubusercontent.com/u/1"
                theme="dark"
            />
        );
        expect(trigger().querySelector('img')).toBeInTheDocument();
        expect(trigger().querySelector('.lucide-user')).toBeNull();
    });

    it('hands the modal the account it was opened for', () => {
        render(
            <NavBar
                userId="u1"
                userName="Ada"
                userImage="https://avatars.githubusercontent.com/u/1"
                theme="dark"
            />
        );
        const menu = openMenu('Menu');
        fireEvent.click(within(menu).getByRole('button', { name: 'Settings' }));

        expect(useModalStore.getState().open?.props).toEqual({
            theme: 'dark',
            userName: 'Ada',
            userImage: 'https://avatars.githubusercontent.com/u/1',
        });
    });

    it('offers a single settings control, never one per breakpoint', () => {
        render(
            <NavBar
                userId="u1"
                userName="Ada"
                userImage={null}
                theme="dark"
            />
        );
        const menu = openMenu('Menu');
        expect(
            within(menu).getAllByRole('button', { name: 'Settings' })
        ).toHaveLength(1);
    });
});
