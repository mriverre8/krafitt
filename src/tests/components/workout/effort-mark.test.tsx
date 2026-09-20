import { EffortMark } from '@/components/workout/effort-mark';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

describe('EffortMark', () => {
    it('says which answer the set was banked with', () => {
        const { container } = render(<EffortMark effort="fail" />);
        expect(screen.getByText('Went to failure')).toHaveClass('sr-only');
        // One or the other: the glyph on a phone, the word from md up.
        expect(container.querySelector('.lucide-x')).toHaveClass('md:hidden');
        expect(screen.getByText('Failure')).toHaveClass('hidden', 'md:inline');
    });

    // Normal is what a set is unless something happened. A word in the corner
    // of every row would be a column of noise rather than a reading.
    it('says nothing about a set that went to plan', () => {
        const { container } = render(<EffortMark effort="normal" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('colours each answer for itself', () => {
        const { container: tough } = render(<EffortMark effort="hard" />);
        const { container: room } = render(<EffortMark effort="easy" />);
        expect(tough.firstChild).toHaveClass('text-draft-ink');
        expect(room.firstChild).toHaveClass('text-surge-ink');
    });

    // Last session's mark sits on a placeholder, and reads like one.
    it('fades when it belongs to the number being offered', () => {
        const { container } = render(
            <EffortMark
                effort="hard"
                faint
            />
        );
        expect(container.firstChild).toHaveClass('opacity-50');
    });

    it('stays out of the way of the field it sits on', () => {
        const { container } = render(<EffortMark effort="hard" />);
        expect(container.firstChild).toHaveClass('pointer-events-none');
    });

    it('reads in the language the set was logged in', () => {
        renderWithLocale(<EffortMark effort="hard" />, 'es');
        expect(screen.getByText('Dura')).toBeInTheDocument();
        expect(screen.getByText('Me ha costado mucho')).toHaveClass('sr-only');
    });
});
