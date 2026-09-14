import { EditModeProvider } from '@/components/routine/edit-mode-provider';
import { EditModeToggle } from '@/components/routine/edit-mode-toggle';
import { WhenEditing } from '@/components/routine/when-editing';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('WhenEditing', () => {
    // A routine opens read-only, so everything that changes it starts out of
    // sight — not merely hidden: it must not be in the tree at all.
    it('keeps its children out of a routine being read', () => {
        render(
            <EditModeProvider>
                <WhenEditing>
                    <button type="button">Delete routine</button>
                </WhenEditing>
            </EditModeProvider>
        );
        expect(screen.queryByText('Delete routine')).not.toBeInTheDocument();
    });

    it('brings them back once Edit is pressed', () => {
        render(
            <EditModeProvider>
                <EditModeToggle />
                <WhenEditing>
                    <button type="button">Delete routine</button>
                </WhenEditing>
            </EditModeProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        expect(screen.getByText('Delete routine')).toBeInTheDocument();
    });

    // Without a provider above it there is no routine being edited, so the
    // context default has to read as "not editing" rather than throw.
    it('shows nothing outside a routine', () => {
        render(
            <WhenEditing>
                <span>Only while editing</span>
            </WhenEditing>
        );
        expect(
            screen.queryByText('Only while editing')
        ).not.toBeInTheDocument();
    });
});
