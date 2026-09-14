import { RoutineCardSkeleton } from '@/components/skeleton/routine-card-skeleton';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('RoutineCardSkeleton', () => {
    // Name, meta, badge, ladder, count: the five bars a real routine card
    // settles into, so nothing jumps when the list lands.
    it('holds the space a routine card will take', () => {
        const { container } = render(<RoutineCardSkeleton />);
        expect(container.querySelectorAll('.animate-pulse')).toHaveLength(5);
    });

    // The routine being trained is the only card with a volt edge, and the
    // placeholder has to reserve that thicker rule or the list shifts sideways
    // the moment the real card arrives.
    it('wears the volt edge only when it stands in for the active routine', () => {
        const { container: plain } = render(<RoutineCardSkeleton />);
        expect(plain.firstElementChild).not.toHaveClass('border-l-volt');

        const { container: accented } = render(<RoutineCardSkeleton accent />);
        expect(accented.firstElementChild).toHaveClass(
            'border-l-volt',
            'border-l-[6px]'
        );
    });
});
