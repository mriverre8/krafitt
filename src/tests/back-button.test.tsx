import { BackButton } from '@/components/back-button';
import { renderWithLocale } from '@/tests/setup-helpers';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const back = vi.fn();
const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ back, push }) }));

/** jsdom starts at length 1; more entries means there is somewhere to go back to. */
function setHistoryLength(length: number) {
    Object.defineProperty(window.history, 'length', {
        value: length,
        configurable: true,
    });
}

describe('BackButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setHistoryLength(1);
    });

    it('goes back to the previous page', () => {
        setHistoryLength(3);
        renderWithLocale(<BackButton fallback="/routines" />);
        fireEvent.click(screen.getByRole('button'));
        expect(back).toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
    });

    // Opened cold — shared link, new tab — back() would do nothing at all.
    it('falls back when there is no history to go back to', () => {
        renderWithLocale(<BackButton fallback="/routines" />);
        fireEvent.click(screen.getByRole('button'));
        expect(push).toHaveBeenCalledWith('/routines');
        expect(back).not.toHaveBeenCalled();
    });

    it('labels itself in the active locale', () => {
        renderWithLocale(<BackButton fallback="/routines" />, 'es');
        expect(screen.getByRole('button')).toHaveTextContent('Volver');
    });
});
