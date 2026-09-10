import { Avatar } from '@/components/ui/avatar';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Avatar', () => {
    it('builds a monogram from the first two words', () => {
        const { container } = render(<Avatar name="Marc Rivera Puig" />);
        expect(container.textContent).toBe('MR');
    });

    it('copes with a single name, and with none at all', () => {
        expect(render(<Avatar name="Marc" />).container.textContent).toBe('M');
        expect(render(<Avatar name="   " />).container.textContent).toBe('?');
    });

    it('keeps an accented initial whole', () => {
        const { container } = render(<Avatar name="Ángel Ñuñez" />);
        expect(container.textContent).toBe('ÁÑ');
    });

    it('stays out of the accessibility tree', () => {
        // The name it stands for is always rendered next to it.
        const { container } = render(<Avatar name="Marc" />);
        expect(container.firstChild).toHaveAttribute('aria-hidden');
    });
});
