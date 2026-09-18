import { ShareProfileButton } from '@/components/profile/share-profile-button';
import { renderWithLocale, withNavigator } from '@/tests/setup-helpers';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The share itself — sheet, clipboard, refusal — belongs to useShare and is
// covered through ShareRoutineButton. What is this button's own is the profile
// it hands out and the two faces it wears while doing it.
beforeEach(() => renderWithLocale(<ShareProfileButton name="Ada" />));

describe('ShareProfileButton', () => {
    it('hands out the profile it sits on, under its owner name', async () => {
        const share = vi.fn(async () => {});
        withNavigator({ share });

        fireEvent.click(screen.getByRole('button', { name: 'Share' }));

        await waitFor(() =>
            expect(share).toHaveBeenCalledWith({
                title: 'Ada',
                url: window.location.href,
            })
        );
    });

    // Copied is the one state the button has to say out loud, and it says it
    // in surge — which has to survive the hover ghostClass brings with it, so
    // the colour is important where the rest of the string is not. How long it
    // lasts is useShare's business, not this button's.
    it('says so once the link is on the clipboard', async () => {
        withNavigator({ writeText: async () => {} });

        fireEvent.click(screen.getByRole('button', { name: 'Share' }));

        const copied = await screen.findByRole('button', {
            name: 'Link copied',
        });
        expect(copied.className).toContain('text-surge!');
    });
});
