import { EffortSelector } from '@/components/workout/effort-selector';
import { EFFORTS } from '@/lib/progress';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

const base = {
    name: '1',
    value: 'normal' as const,
    onChange: () => {},
};

describe('EffortSelector', () => {
    it('offers the whole scale, worst first', () => {
        render(<EffortSelector {...base} />);
        const options = screen.getAllByRole('radio');
        expect(options).toHaveLength(EFFORTS.length);
        expect(
            options.map((option) => option.getAttribute('aria-label'))
        ).toEqual([
            'Went to failure',
            'Really tough',
            'As planned',
            'Had more in the tank',
        ]);
    });

    it('marks the one it was given, and only that one', () => {
        render(
            <EffortSelector
                {...base}
                value="hard"
            />
        );
        expect(screen.getByLabelText('Really tough')).toBeChecked();
        expect(screen.getByLabelText('As planned')).not.toBeChecked();
    });

    it('reports the answer that was picked', () => {
        const onChange = vi.fn();
        render(
            <EffortSelector
                {...base}
                onChange={onChange}
            />
        );
        fireEvent.click(screen.getByLabelText('Went to failure'));
        expect(onChange).toHaveBeenCalledWith('fail');
    });

    // The press that asks the question takes the pressed button off screen, so
    // without this a keyboard is left on the page body with nothing said.
    it('takes the focus on the answer already marked', () => {
        render(
            <EffortSelector
                {...base}
                value="easy"
            />
        );
        expect(screen.getByLabelText('Had more in the tank')).toHaveFocus();
    });

    it('names the set it is asking about', () => {
        render(
            <EffortSelector
                {...base}
                name="DS1"
            />
        );
        expect(
            screen.getByRole('radiogroup', { name: 'How set DS1 felt' })
        ).toBeInTheDocument();
    });

    it('asks in the reader’s language', () => {
        renderWithLocale(<EffortSelector {...base} />, 'es');
        expect(screen.getByLabelText('Llegué al fallo')).toBeInTheDocument();
        expect(
            screen.getByRole('radiogroup', { name: 'Cómo ha ido la serie 1' })
        ).toBeInTheDocument();
    });
});
