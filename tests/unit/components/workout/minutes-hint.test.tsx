import { MinutesHint } from '@/components/workout/minutes-hint';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from '../../setup-helpers';

describe('MinutesHint', () => {
    // Under a minute the seconds already read fine; a blank box has nothing.
    it('says nothing under a minute', () => {
        for (const seconds of ['', '0', '45', '59']) {
            const { container, unmount } = render(
                <MinutesHint seconds={seconds} />
            );
            expect(container).toBeEmptyDOMElement();
            unmount();
        }
    });

    it('reads a whole minute as just minutes', () => {
        render(<MinutesHint seconds="60" />);
        expect(screen.getByText('1 min')).toBeInTheDocument();
    });

    it('reads the rest as minutes and seconds', () => {
        render(<MinutesHint seconds="90" />);
        expect(screen.getByText('1:30 min')).toBeInTheDocument();
    });

    it('pads the seconds to two digits', () => {
        render(<MinutesHint seconds="61" />);
        expect(screen.getByText('1:01 min')).toBeInTheDocument();
    });

    // It is a box note, so globals.css lifts the number above it.
    it('sits in the box as a note', () => {
        render(<MinutesHint seconds="120" />);
        expect(screen.getByText('2 min')).toHaveAttribute('data-note');
    });

    it('translates its unit', () => {
        renderWithLocale(<MinutesHint seconds="90" />, 'es');
        expect(screen.getByText('1:30 min')).toBeInTheDocument();
    });
});
