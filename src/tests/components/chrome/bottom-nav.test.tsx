import { BottomNav } from '@/components/chrome/bottom-nav';
import {
    EditModeProvider,
    EditModeToggle,
} from '@/components/routine/edit-mode';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

describe('BottomNav', () => {
    it('links home, the routines and your own profile', () => {
        render(<BottomNav userId="u1" />);
        expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
            'href',
            '/'
        );
        expect(screen.getByRole('link', { name: 'Routines' })).toHaveAttribute(
            'href',
            '/routines'
        );
        expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
            'href',
            '/profile/u1'
        );
    });

    it('marks the section you are in, down to a routine of it', () => {
        pathname = '/routines/r1';
        render(<BottomNav userId="u1" />);
        expect(screen.getByRole('link', { name: 'Routines' })).toHaveAttribute(
            'aria-current',
            'page'
        );
        expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute(
            'aria-current'
        );
    });

    it('links the workouts, and marks them inside one', () => {
        pathname = '/workouts/w1';
        render(<BottomNav userId="u1" />);
        const workouts = screen.getByRole('link', { name: 'Workouts' });
        expect(workouts).toHaveAttribute('href', '/workouts');
        expect(workouts).toHaveAttribute('aria-current', 'page');
        expect(screen.getAllByRole('link')).toHaveLength(4);
    });

    // Someone else's profile is not "Profile": the tab is your own.
    it('leaves Profile unmarked on another user', () => {
        pathname = '/profile/u2';
        render(<BottomNav userId="u1" />);
        expect(
            screen.getByRole('link', { name: 'Profile' })
        ).not.toHaveAttribute('aria-current');
    });
});

// The bar sits outside the routine's context and hides on this attribute.
describe('EditModeProvider', () => {
    it('flags <html> while editing, and clears it on the way out', () => {
        const root = document.documentElement;
        const { unmount } = render(
            <EditModeProvider>
                <EditModeToggle />
            </EditModeProvider>
        );
        expect(root).not.toHaveAttribute('data-editing');

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
        expect(root).toHaveAttribute('data-editing');

        unmount();
        expect(root).not.toHaveAttribute('data-editing');
    });
});

describe('BottomNav order', () => {
    it('puts the workouts before the routines', () => {
        pathname = '/';
        render(<BottomNav userId="u1" />);
        expect(
            screen
                .getAllByRole('link')
                .map((link) => link.getAttribute('aria-label'))
        ).toEqual(['Home', 'Workouts', 'Routines', 'Profile']);
    });
});
