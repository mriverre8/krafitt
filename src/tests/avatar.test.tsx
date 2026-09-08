import { Avatar } from '@/components/avatar';
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

    it('shows the photo instead once there is one', () => {
        render(
            <Avatar
                name="Marc"
                image="https://example.com/me.jpg"
            />
        );
        const photo = screen.getByRole('presentation', { hidden: true });
        expect(photo).toHaveAttribute('src', 'https://example.com/me.jpg');
    });

    it('stays out of the accessibility tree either way', () => {
        // The name it stands for is always rendered next to it.
        const { container } = render(<Avatar name="Marc" />);
        expect(container.firstChild).toHaveAttribute('aria-hidden');
    });
});
