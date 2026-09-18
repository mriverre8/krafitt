import { ShareRoutineButton } from '@/components/routine/share-routine-button';
import { renderWithLocale } from '@/tests/setup-helpers';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** jsdom has neither, so each test says which of the two the device offers. */
function withNavigator(api: {
    share?: (data: ShareData) => Promise<void>;
    writeText?: (text: string) => Promise<void>;
}) {
    Object.defineProperty(navigator, 'share', {
        value: api.share,
        configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
        value: api.writeText ? { writeText: api.writeText } : undefined,
        configurable: true,
    });
}

const button = () => screen.getByRole('button', { name: 'Share' });

beforeEach(() => renderWithLocale(<ShareRoutineButton name="Strength" />));

describe('ShareRoutineButton', () => {
    it('hands the routine to the system share sheet where there is one', async () => {
        const share = vi.fn(async () => {});
        withNavigator({ share, writeText: vi.fn(async () => {}) });

        fireEvent.click(button());

        await waitFor(() =>
            expect(share).toHaveBeenCalledWith({
                title: 'Strength',
                url: window.location.href,
            })
        );
        // The sheet is the confirmation: nothing was copied, so nothing says so.
        expect(screen.queryByText('Link copied')).not.toBeInTheDocument();
    });

    it('falls back to the clipboard where there is no sheet', async () => {
        const writeText = vi.fn(async () => {});
        withNavigator({ writeText });

        fireEvent.click(button());

        await waitFor(() =>
            expect(writeText).toHaveBeenCalledWith(window.location.href)
        );
        expect(screen.getByText('Link copied')).toBeInTheDocument();
    });

    // A sheet the user dismissed, or a clipboard the browser refused, must not
    // leave the button claiming it passed on a link that never went anywhere.
    it('claims nothing when the share is refused', async () => {
        withNavigator({
            share: async () => {
                throw new Error('AbortError');
            },
        });

        fireEvent.click(button());

        await waitFor(() =>
            expect(screen.queryByText('Link copied')).not.toBeInTheDocument()
        );
        expect(button()).toBeInTheDocument();
    });
});
