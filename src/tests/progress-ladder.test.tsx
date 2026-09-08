import { ProgressLadder } from '@/components/progress-ladder';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ProgressLadder', () => {
    it('draws one segment per workout', () => {
        const { container } = render(
            <ProgressLadder
                done={2}
                total={6}
                label="2/6 workouts"
            />
        );
        expect(container.querySelectorAll('span')).toHaveLength(6);
        expect(
            screen.getByRole('img', { name: '2/6 workouts' })
        ).toBeInTheDocument();
    });

    it('fills the done segments and outlines the next one', () => {
        const { container } = render(
            <ProgressLadder
                done={2}
                total={4}
                label="2/4"
            />
        );
        const segments = [...container.querySelectorAll('span')];
        expect(
            segments.slice(0, 2).every((s) => s.className.includes('bg-volt'))
        ).toBe(true);
        expect(segments[2].className).toContain('ring-pulse');
        expect(segments[3].className).toContain('bg-surface2');
    });

    it('never fills past the end of the routine', () => {
        const { container } = render(
            <ProgressLadder
                done={99}
                total={3}
                label="3/3"
            />
        );
        const segments = [...container.querySelectorAll('span')];
        expect(segments.every((s) => s.className.includes('bg-volt'))).toBe(
            true
        );
    });

    it('switches to a bar when there are too many segments to read', () => {
        const { container } = render(
            <ProgressLadder
                done={10}
                total={40}
                label="10/40"
            />
        );
        expect(container.querySelectorAll('span')).toHaveLength(0);
        const fill = screen.getByRole('img', { name: '10/40' })
            .firstElementChild as HTMLElement;
        expect(fill.style.width).toBe('25%');
    });
});
