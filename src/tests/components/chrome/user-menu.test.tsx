import { UserMenu } from '@/components/chrome/user-menu';
import { useModalStore } from '@/store/modal';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
vi.mock('@/lib/auth-client', () => ({
    authClient: { signOut: vi.fn().mockResolvedValue(undefined) },
}));

const PICTURE = 'https://avatars.githubusercontent.com/u/1';

beforeEach(() => vi.clearAllMocks());

function openMenu(image: string | null = null) {
    render(
        <UserMenu
            name="Ada"
            image={image}
            theme="dark"
        />
    );
    const trigger = screen.getByRole('button', { name: 'Menu' });
    fireEvent.click(trigger);
    return {
        trigger,
        menu: screen.getByLabelText('Menu', { selector: 'div' }),
    };
}

describe('UserMenu', () => {
    // The generic icon is a placeholder for a picture: whoever has one sees
    // themselves instead, and either way the name says whose account this is.
    it('wears the picture in the trigger when there is one', () => {
        const { rerender } = render(
            <UserMenu
                name="Ada"
                image={null}
                theme="dark"
            />
        );
        const trigger = () => screen.getByRole('button', { name: 'Menu' });
        expect(trigger()).toHaveTextContent('Ada');
        expect(trigger().querySelector('img')).toBeNull();
        expect(trigger().querySelector('.lucide-user')).toBeInTheDocument();

        rerender(
            <UserMenu
                name="Ada"
                image={PICTURE}
                theme="dark"
            />
        );
        expect(trigger().querySelector('img')).toBeInTheDocument();
        expect(trigger().querySelector('.lucide-user')).toBeNull();
    });

    // Below md the bar hides the app links, so the menu is the navigation.
    it('repeats the app links and adds what is done to the account', () => {
        const { menu } = openMenu();
        expect(
            Array.from(menu.querySelectorAll('a, button')).map(
                (item) => item.textContent
            )
        ).toEqual(['Today', 'Routines', 'Profile', 'Settings', 'Sign out']);
        expect(
            within(menu).getByRole('link', { name: 'Profile' })
        ).toHaveAttribute('href', '/profile');
    });

    it('opens settings for this account, and closes the menu behind it', () => {
        const { menu } = openMenu(PICTURE);
        fireEvent.click(within(menu).getByRole('button', { name: 'Settings' }));

        expect(useModalStore.getState().open).toEqual({
            kind: 'settings',
            props: { theme: 'dark', userName: 'Ada', userImage: PICTURE },
        });
        expect(menu).not.toBeInTheDocument();
    });

    // Signing out is one click away from losing an unsaved workout.
    it('confirms before signing out, then refreshes', async () => {
        const { authClient } = await import('@/lib/auth-client');
        const { menu } = openMenu();
        fireEvent.click(within(menu).getByRole('button', { name: 'Sign out' }));

        const open = useModalStore.getState().open;
        expect(open?.kind).toBe('confirm');
        expect(authClient.signOut).not.toHaveBeenCalled();

        await (
            open?.props as unknown as { onConfirm: () => Promise<void> }
        ).onConfirm();
        expect(authClient.signOut).toHaveBeenCalled();
        expect(refresh).toHaveBeenCalled();
    });
});
