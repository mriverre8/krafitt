import { EditModeProvider } from '@/components/routine/edit-mode-provider';
import { EditModeToggle } from '@/components/routine/edit-mode-toggle';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from './setup-helpers';

const toggle = () => screen.getByRole('button');

describe('EditModeToggle', () => {
    // aria-pressed, not two unrelated buttons: it is one control with a state,
    // and the label names the move rather than the mode.
    it('reports the mode it is in, and names the way out', () => {
        render(
            <EditModeProvider>
                <EditModeToggle />
            </EditModeProvider>
        );

        expect(toggle()).toHaveAccessibleName('Edit');
        expect(toggle()).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(toggle());
        expect(toggle()).toHaveAccessibleName('Done');
        expect(toggle()).toHaveAttribute('aria-pressed', 'true');
    });

    it('goes back to read mode on a second press', () => {
        render(
            <EditModeProvider>
                <EditModeToggle />
            </EditModeProvider>
        );

        fireEvent.click(toggle());
        fireEvent.click(toggle());
        expect(toggle()).toHaveAccessibleName('Edit');
    });

    it('translates both halves', () => {
        renderWithLocale(
            <EditModeProvider>
                <EditModeToggle />
            </EditModeProvider>,
            'es'
        );

        expect(toggle()).toHaveAccessibleName('Editar');
        fireEvent.click(toggle());
        expect(toggle()).toHaveAccessibleName('Listo');
    });
});
