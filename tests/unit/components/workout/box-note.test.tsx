import { BoxNote } from '@/components/workout/box-note';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('BoxNote', () => {
    it('reads its text back', () => {
        render(<BoxNote>1:30 min</BoxNote>);
        expect(screen.getByText('1:30 min')).toBeInTheDocument();
    });

    // globals.css finds the note by this mark to lift the number above it.
    it('marks itself for the box to make room', () => {
        render(<BoxNote>Bodyweight</BoxNote>);
        expect(screen.getByText('Bodyweight')).toHaveAttribute('data-note');
    });

    // The box announces its own value; the note only says it again.
    it('stays out of the accessibility tree', () => {
        render(<BoxNote>Bodyweight</BoxNote>);
        expect(screen.getByText('Bodyweight')).toHaveAttribute(
            'aria-hidden',
            'true'
        );
    });

    // It sits over the input: a tap on it has to land in the box.
    it('lets taps through to the box underneath', () => {
        render(<BoxNote>1 min</BoxNote>);
        expect(screen.getByText('1 min')).toHaveClass(
            'pointer-events-none',
            'absolute'
        );
    });
});
