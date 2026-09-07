import { LocaleSwitcher } from '@/components/locale-switcher';
import { LOCALE_COOKIE } from '@/i18n/config';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from './setup-helpers';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh: () => refresh() }),
}));

describe('LocaleSwitcher', () => {
    it('offers the three supported locales', () => {
        render(<LocaleSwitcher />);
        expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('marks the current locale as pressed', () => {
        renderWithLocale(<LocaleSwitcher />, 'ca');
        expect(screen.getByRole('button', { name: 'ca' })).toHaveAttribute(
            'aria-pressed',
            'true'
        );
        expect(screen.getByRole('button', { name: 'en' })).toHaveAttribute(
            'aria-pressed',
            'false'
        );
    });

    it('stores the choice and refreshes the server-rendered copy', () => {
        render(<LocaleSwitcher />);
        fireEvent.click(screen.getByRole('button', { name: 'es' }));
        expect(document.cookie).toContain(`${LOCALE_COOKIE}=es`);
        expect(refresh).toHaveBeenCalled();
    });
});
