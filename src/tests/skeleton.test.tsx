import { Bar } from '@/components/skeleton/bar';
import { Skeleton } from '@/components/skeleton/skeleton';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from './setup-helpers';

describe('Skeleton', () => {
    // The bars say nothing worth announcing, so the busy status is the whole
    // message: one voice, not a reading of every placeholder on the page.
    it('announces the wait and hides the bars', () => {
        render(
            <Skeleton>
                <Bar className="h-7 w-2/3" />
            </Skeleton>
        );

        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(status.querySelector('[aria-hidden]')).not.toBeNull();
    });

    it('draws the bars it is given', () => {
        const { container } = render(
            <Skeleton>
                <Bar className="h-2" />
                <Bar className="h-4" />
            </Skeleton>
        );
        expect(container.querySelectorAll('.animate-pulse')).toHaveLength(2);
    });

    it('translates the wait', () => {
        renderWithLocale(
            <Skeleton>
                <Bar />
            </Skeleton>,
            'es'
        );
        expect(screen.getByText('Cargando')).toBeInTheDocument();
    });
});
