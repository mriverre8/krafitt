import { ThemeToggle } from '@/components/chrome/theme-toggle';
import { THEME_COOKIE, type Theme } from '@/lib/theme';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

/** The server paints the <html> class from the same cookie it reads the prop from. */
function renderTheme(theme: Theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    return render(<ThemeToggle theme={theme} />);
}

describe('ThemeToggle', () => {
    beforeEach(() => {
        document.documentElement.className = '';
        document.cookie = `${THEME_COOKIE}=; max-age=0; path=/`;
    });

    it('offers the sun in dark mode and the moon in light mode', () => {
        const { container } = renderTheme('dark');
        expect(container.querySelector('.lucide-sun')).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText('Switch theme'));
        expect(container.querySelector('.lucide-moon')).toBeInTheDocument();
    });

    it('switches the html class from dark to light', () => {
        renderTheme('dark');
        fireEvent.click(screen.getByLabelText('Switch theme'));
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('switches back to dark', () => {
        renderTheme('light');
        fireEvent.click(screen.getByLabelText('Switch theme'));
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('stores the choice so the server renders the same theme', () => {
        renderTheme('dark');
        fireEvent.click(screen.getByLabelText('Switch theme'));
        expect(document.cookie).toContain(`${THEME_COOKIE}=light`);
    });

    it('reports the current theme as a switch', () => {
        renderTheme('dark');
        expect(screen.getByRole('switch')).toHaveAttribute(
            'aria-checked',
            'true'
        );
        fireEvent.click(screen.getByRole('switch'));
        expect(screen.getByRole('switch')).toHaveAttribute(
            'aria-checked',
            'false'
        );
    });

    // Regression: inside the settings menu this unmounts on close, so seeding
    // state from the prop brought back the theme the page was loaded with.
    it('reads the live theme when remounted with a stale prop', () => {
        const first = renderTheme('dark');
        fireEvent.click(screen.getByLabelText('Switch theme'));
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        first.unmount();

        render(<ThemeToggle theme="dark" />);
        expect(screen.getByRole('switch')).toHaveAttribute(
            'aria-checked',
            'false'
        );
    });
});
