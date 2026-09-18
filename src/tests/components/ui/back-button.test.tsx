import {
    EditModeBackButton,
    EditModeProvider,
    EditModeToggle,
    useDiscardSignal,
} from '@/components/routine/edit-mode';
import { BackButton } from '@/components/ui/back-button';
import {
    acceptConfirm,
    openConfirm,
    renderWithLocale,
    withModals,
} from '@/tests/setup-helpers';
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

    // The follows tabs each leave a step behind, so back() would walk through
    // the tabs instead of leaving the page.
    it('goes straight to the fallback when told to skip history', () => {
        setHistoryLength(3);
        renderWithLocale(
            <BackButton
                fallback="/profile/ada"
                skipHistory
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(push).toHaveBeenCalledWith('/profile/ada');
        expect(back).not.toHaveBeenCalled();
    });

    it('labels itself in the active locale', () => {
        renderWithLocale(<BackButton fallback="/routines" />, 'es');
        expect(screen.getByRole('button')).toHaveTextContent('Volver');
    });

    it('runs an onBack instead of leaving the page', () => {
        setHistoryLength(3);
        const onBack = vi.fn();
        renderWithLocale(
            <BackButton
                fallback="/routines"
                onBack={onBack}
            />
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onBack).toHaveBeenCalled();
        expect(back).not.toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
    });
});

/** A day that says it is unsaved, so the routine has something to ask about. */
function DirtyDay() {
    useDiscardSignal('d1', true);
    return null;
}

/** The routine's header as the page builds it, with or without a dirty day. */
function routine({ dirty = false } = {}) {
    renderWithLocale(
        withModals(
            <EditModeProvider>
                <EditModeBackButton fallback="/routines" />
                <EditModeToggle />
                {dirty && <DirtyDay />}
            </EditModeProvider>
        )
    );
    return {
        back: () => screen.getByRole('button', { name: 'Back' }),
        edit: (name: 'Edit' | 'Done') => screen.getByRole('button', { name }),
    };
}

describe('EditModeBackButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setHistoryLength(3);
    });

    it('leaves the page while the routine is only being read', () => {
        const ui = routine();
        fireEvent.click(ui.back());
        expect(back).toHaveBeenCalled();
    });

    it('steps out of edit mode and stays on the page', () => {
        const ui = routine();
        fireEvent.click(ui.edit('Edit'));
        fireEvent.click(ui.back());

        expect(back).not.toHaveBeenCalled();
        expect(push).not.toHaveBeenCalled();
        expect(ui.edit('Edit')).toBeInTheDocument();
    });

    // The same question Done asks, because it throws the same drafts away.
    it('asks first when a day is unsaved, and waits', async () => {
        const ui = routine({ dirty: true });
        fireEvent.click(ui.edit('Edit'));
        fireEvent.click(ui.back());

        const dialog = await openConfirm();
        expect(dialog).toHaveTextContent('Unsaved changes');
        expect(ui.edit('Done')).toBeInTheDocument();

        await acceptConfirm('Discard changes');
        expect(ui.edit('Edit')).toBeInTheDocument();
        expect(back).not.toHaveBeenCalled();
    });
});
