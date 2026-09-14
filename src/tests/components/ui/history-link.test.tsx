import { HistoryLink } from '@/components/ui/history-link';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('HistoryLink', () => {
    it('points at the history of the routine it was given', () => {
        render(<HistoryLink routineId="r1" />);
        expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute(
            'href',
            '/routines/r1/progress'
        );
    });

    // In a list every card carries one of these, and a column of identical
    // "History" links leaves a screen reader with nothing to tell them apart.
    it('names the routine when it is one of many', () => {
        render(
            <HistoryLink
                routineId="r1"
                name="Push Pull Legs"
            />
        );
        expect(
            screen.getByRole('link', { name: 'History of Push Pull Legs' })
        ).toBeInTheDocument();
    });
});
