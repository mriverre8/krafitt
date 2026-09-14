import { Wordmark } from '@/components/ui/wordmark';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Wordmark', () => {
    // Split across spans for the slab, so the one thing worth guarding is that
    // it still reads as a single word to anything that is not looking at it.
    it('reads as one word', () => {
        const { container } = render(<Wordmark />);
        expect(container.firstElementChild).toHaveTextContent(/^Krafitt$/);
    });

    // Sized by the caller through font-size: the slab scales with the text.
    it('is sized by the caller', () => {
        const { container } = render(<Wordmark className="text-2xl" />);
        expect(container.firstElementChild).toHaveClass('text-2xl');
    });
});
