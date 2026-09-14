import { EditModeProvider } from '@/components/routine/edit-mode-provider';
import { EditModeToggle } from '@/components/routine/edit-mode-toggle';
import { WhenNotEditing } from '@/components/routine/when-not-editing';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('WhenNotEditing', () => {
    it('shows its children while the routine is being read', () => {
        render(
            <EditModeProvider>
                <WhenNotEditing>
                    <button type="button">Set active</button>
                </WhenNotEditing>
            </EditModeProvider>
        );
        expect(screen.getByText('Set active')).toBeInTheDocument();
    });

    // Activating a routine mid-edit would freeze a plan that is still being
    // written, so the move steps aside rather than sitting there disabled.
    it('takes them away once Edit is pressed', () => {
        render(
            <EditModeProvider>
                <EditModeToggle />
                <WhenNotEditing>
                    <button type="button">Set active</button>
                </WhenNotEditing>
            </EditModeProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        expect(screen.queryByText('Set active')).not.toBeInTheDocument();
    });

    it('shows its children outside a routine', () => {
        render(
            <WhenNotEditing>
                <span>Always here</span>
            </WhenNotEditing>
        );
        expect(screen.getByText('Always here')).toBeInTheDocument();
    });
});
