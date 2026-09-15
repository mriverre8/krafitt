import {
    EditModeProvider,
    WhenEditing,
} from '@/components/routine/edit-mode';
import { EmptyRoutine } from '@/components/routine/empty-routine';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from './setup-helpers';

/** As the routine page renders it: inside the provider, with a marker standing
    in for the day form that edit mode brings on screen. */
function setup() {
    renderWithLocale(
        <EditModeProvider>
            <EmptyRoutine />
            <WhenEditing>
                <p>day form</p>
            </WhenEditing>
        </EditModeProvider>
    );
}

describe('EmptyRoutine', () => {
    it('offers the one move a routine with no days has', () => {
        setup();
        expect(
            screen.getByRole('heading', { name: 'This routine has no days' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Build routine' })
        ).toBeInTheDocument();
    });

    it('stands down once its button has opened edit mode', () => {
        setup();
        fireEvent.click(screen.getByRole('button', { name: 'Build routine' }));

        expect(screen.getByText('day form')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Build routine' })
        ).not.toBeInTheDocument();
    });
});
