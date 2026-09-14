import { Bar } from '@/components/skeleton/bar';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Bar', () => {
    // A bar exists to hold exactly the space the real thing will take, so the
    // size it is given has to survive onto the element.
    it('keeps the size the caller asks for', () => {
        const { container } = render(<Bar className="h-7 w-2/3" />);
        expect(container.firstElementChild).toHaveClass('h-7', 'w-2/3');
    });

    it('pulses on the one grey that reads on a card and on the page', () => {
        const { container } = render(<Bar />);
        expect(container.firstElementChild).toHaveClass(
            'bg-line',
            'animate-pulse'
        );
    });

    // It is drawn inside a Skeleton, which is already aria-hidden and already
    // carries the busy status: a bar of its own must add no second voice.
    it('says nothing to a screen reader', () => {
        const { container } = render(<Bar />);
        expect(container.textContent).toBe('');
        expect(container.querySelector('[role]')).toBeNull();
    });
});
