import { EmptyState } from '@/components/ui/empty-state';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('EmptyState', () => {
    // Either one puts something on the home screen: the way to both is there,
    // workouts first, as the navigation has them.
    it('shows the message and points at the workouts and the routines', () => {
        render(
            <EmptyState
                title="Nothing in progress"
                body="Start something first."
            />
        );
        expect(
            screen.getByRole('heading', { name: 'Nothing in progress' })
        ).toBeInTheDocument();
        expect(
            screen
                .getAllByRole('link')
                .map((link) => [link.textContent, link.getAttribute('href')])
        ).toEqual([
            ['Go to my workouts', '/workouts'],
            ['Go to my routines', '/routines'],
        ]);
    });
});
