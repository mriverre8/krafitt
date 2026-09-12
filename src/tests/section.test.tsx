import { Section } from '@/components/landing/section';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from './setup-helpers';

describe('Section', () => {
    it('renders the eyebrow, title, lead and children', () => {
        render(
            <Section
                id="today"
                eyebrow="landing.todayEyebrow"
                title="landing.todayTitle"
                lead="landing.feature3"
            >
                <p>Child content</p>
            </Section>
        );

        expect(
            screen.getByRole('heading', { name: "Today's workout" })
        ).toHaveAttribute('id', 'today-title');
        expect(
            screen.getByRole('region', { name: "Today's workout" })
        ).toHaveAttribute('id', 'today');
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('shows the note only when given one', () => {
        const { rerender } = render(
            <Section
                id="editor"
                eyebrow="landing.editorEyebrow"
                title="landing.editorTitle"
                lead="landing.feature1"
            >
                <p>Body</p>
            </Section>
        );
        expect(screen.getByText('Write the plan')).toBeInTheDocument();

        rerender(
            <Section
                id="today"
                eyebrow="landing.todayEyebrow"
                title="landing.todayTitle"
                lead="landing.feature3"
                note="landing.feature2"
            >
                <p>Body</p>
            </Section>
        );
        expect(
            screen.getByText(/shows the workout you owe today/)
        ).toBeInTheDocument();
    });

    it('translates its text', () => {
        renderWithLocale(
            <Section
                id="today"
                eyebrow="landing.todayEyebrow"
                title="landing.todayTitle"
                lead="landing.feature3"
            >
                <p>Child</p>
            </Section>,
            'es'
        );
        expect(
            screen.getByRole('heading', { name: 'El entreno de hoy' })
        ).toBeInTheDocument();
    });
});
