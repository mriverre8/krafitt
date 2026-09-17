import { UserMenu } from '@/components/chrome/user-menu';
import { useModalStore } from '@/store/modal';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('@/lib/auth-client', () => ({
    authClient: { signOut: vi.fn().mockResolvedValue(undefined) },
}));

beforeEach(() => {
    refresh.mockClear();
    useModalStore.getState().close();
});

function openMenu(props: Partial<Parameters<typeof UserMenu>[0]> = {}) {
    render(
        <UserMenu
            name="Ada"
            image={null}
            theme="dark"
            {...props}
        />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    return screen.getByLabelText('Menu', { selector: 'div' });
}

describe('UserMenu', () => {
    it('stays shut until the trigger is clicked', () => {
        render(
            <UserMenu
                name="Ada"
                image={null}
                theme="dark"
            />
        );
        const trigger = screen.getByRole('button', { name: 'Menu' });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(
            screen.queryByRole('link', { name: 'Profile' })
        ).not.toBeInTheDocument();

        fireEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    // On a phone this menu is the whole navigation: where you go, then whose
    // account it is, then what you do to it.
    it('lists the account in navigation order', () => {
        const menu = openMenu();
        expect(
            Array.from(menu.querySelectorAll('a, button')).map(
                (item) => item.textContent
            )
        ).toEqual(['Today', 'Routines', 'Profile', 'Settings', 'Sign out']);
    });

    it('closes itself on the way out to a page', () => {
        const menu = openMenu();
        fireEvent.click(within(menu).getByRole('link', { name: 'Profile' }));
        expect(menu).not.toBeInTheDocument();
    });

    it('opens settings for the account it belongs to, and closes', () => {
        const menu = openMenu({ image: 'https://example.test/ada.png' });
        fireEvent.click(within(menu).getByRole('button', { name: 'Settings' }));

        expect(useModalStore.getState().open).toEqual({
            kind: 'settings',
            props: {
                theme: 'dark',
                userName: 'Ada',
                userImage: 'https://example.test/ada.png',
            },
        });
        expect(menu).not.toBeInTheDocument();
    });

    // Signing out is a click away from losing an unsaved workout, so it asks
    // first — and only the answer signs out.
    it('confirms before signing out, then refreshes', async () => {
        const { authClient } = await import('@/lib/auth-client');
        const menu = openMenu();
        fireEvent.click(within(menu).getByRole('button', { name: 'Sign out' }));

        const open = useModalStore.getState().open;
        expect(open?.kind).toBe('confirm');
        expect(authClient.signOut).not.toHaveBeenCalled();

        await (open?.props as { onConfirm: () => void }).onConfirm();
        expect(authClient.signOut).toHaveBeenCalled();
        expect(refresh).toHaveBeenCalled();
    });

    // The generic icon is a placeholder for a picture, so whoever has one sees
    // themselves instead.
    it('wears the picture in the trigger once there is one', () => {
        const { rerender } = render(
            <UserMenu
                name="Ada"
                image={null}
                theme="dark"
            />
        );
        const trigger = () => screen.getByRole('button', { name: 'Menu' });
        expect(trigger().querySelector('img')).toBeNull();
        expect(trigger().querySelector('.lucide-user')).toBeInTheDocument();

        rerender(
            <UserMenu
                name="Ada"
                image="https://example.test/ada.png"
                theme="dark"
            />
        );
        expect(trigger().querySelector('img')).toBeInTheDocument();
        expect(trigger().querySelector('.lucide-user')).toBeNull();
    });

    it('truncates rather than lets a long name push the bar around', () => {
        render(
            <UserMenu
                name={'Ada '.repeat(20)}
                image={null}
                theme="dark"
            />
        );
        expect(
            screen
                .getByRole('button', { name: 'Menu' })
                .querySelector('.truncate')
        ).toBeInTheDocument();
    });
});
