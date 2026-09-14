import { EditModeProvider } from '@/components/routine/edit-mode-provider';
import { EditModeToggle } from '@/components/routine/edit-mode-toggle';
import { useDirtyDays, useDiscardSignal, useEditMode } from '@/lib/edit-mode';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { acceptConfirm, declineConfirm, withModals } from './setup-helpers';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

/** Stands in for one day of the routine: it reports its own dirtiness and
    reads back the signal that tells it to start over. */
function Day({ id, dirty }: { id: string; dirty: boolean }) {
    const discarded = useDiscardSignal(id, dirty);
    return <p>{`${id} discarded ${discarded}`}</p>;
}

function Probe() {
    const editing = useEditMode();
    const dirtyDays = useDirtyDays();
    return (
        <p>{`${editing ? 'editing' : 'reading'}, dirty: ${
            [...dirtyDays].sort().join(',') || 'none'
        }`}</p>
    );
}

const edit = () => screen.getByRole('button', { name: /Edit|Done/ });

describe('EditModeProvider', () => {
    it('opens a routine read-only', () => {
        render(
            <EditModeProvider>
                <Probe />
            </EditModeProvider>
        );
        expect(screen.getByText('reading, dirty: none')).toBeInTheDocument();
    });

    it('collects which days are unsaved, and lets them go again', () => {
        function Routine() {
            const [dirty, setDirty] = useState(false);
            return (
                <EditModeProvider>
                    <Probe />
                    <Day
                        id="day-1"
                        dirty={dirty}
                    />
                    <button
                        type="button"
                        onClick={() => setDirty((d) => !d)}
                    >
                        touch
                    </button>
                </EditModeProvider>
            );
        }

        render(<Routine />);
        expect(screen.getByText(/dirty: none/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'touch' }));
        expect(screen.getByText(/dirty: day-1/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'touch' }));
        expect(screen.getByText(/dirty: none/)).toBeInTheDocument();
    });

    // A day that leaves the page — deleted, or the routine closed — takes its
    // unsaved state with it and must not stay on the list.
    it('forgets a day that leaves the page', () => {
        function Routine() {
            const [shown, setShown] = useState(true);
            return (
                <EditModeProvider>
                    <Probe />
                    {shown && (
                        <Day
                            id="day-1"
                            dirty
                        />
                    )}
                    <button
                        type="button"
                        onClick={() => setShown(false)}
                    >
                        drop
                    </button>
                </EditModeProvider>
            );
        }

        render(<Routine />);
        expect(screen.getByText(/dirty: day-1/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'drop' }));
        expect(screen.getByText(/dirty: none/)).toBeInTheDocument();
    });

    it('leaves edit mode without asking when nothing was touched', () => {
        render(
            withModals(
                <EditModeProvider>
                    <EditModeToggle />
                    <Probe />
                    <Day
                        id="day-1"
                        dirty={false}
                    />
                </EditModeProvider>
            )
        );

        fireEvent.click(edit());
        expect(screen.getByText(/^editing/)).toBeInTheDocument();

        fireEvent.click(edit());
        expect(screen.getByText(/^reading/)).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Leaving edit mode throws the drafts away, so the days are told to start
    // over — `discarded` rises, and the list of dirty days is emptied.
    it('asks first, then signals every day to start over', async () => {
        render(
            withModals(
                <EditModeProvider>
                    <EditModeToggle />
                    <Probe />
                    <Day
                        id="day-1"
                        dirty
                    />
                </EditModeProvider>
            )
        );

        fireEvent.click(edit());
        expect(screen.getByText('day-1 discarded 0')).toBeInTheDocument();

        fireEvent.click(edit());
        await acceptConfirm('Discard changes');

        expect(screen.getByText('day-1 discarded 1')).toBeInTheDocument();
        expect(screen.getByText(/^reading/)).toBeInTheDocument();
    });

    it('stays in edit mode, drafts intact, when the ask is refused', async () => {
        render(
            withModals(
                <EditModeProvider>
                    <EditModeToggle />
                    <Probe />
                    <Day
                        id="day-1"
                        dirty
                    />
                </EditModeProvider>
            )
        );

        fireEvent.click(edit());
        fireEvent.click(edit());
        await declineConfirm();

        expect(screen.getByText('day-1 discarded 0')).toBeInTheDocument();
        expect(screen.getByText(/^editing, dirty: day-1/)).toBeInTheDocument();
    });
});
