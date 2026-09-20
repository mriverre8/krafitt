import { SetRow } from '@/components/workout/set-row';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

const base = {
    setIndex: 0,
    enabled: true,
    onSave: () => {},
};

describe('SetRow', () => {
    it('disables both inputs when the set is locked', () => {
        render(
            <SetRow
                {...base}
                enabled={false}
            />
        );
        expect(screen.getByLabelText('Weight set 1')).toBeDisabled();
        expect(screen.getByLabelText('Reps set 1')).toBeDisabled();
        expect(screen.getByLabelText('Save set 1')).toBeDisabled();
    });

    it('keeps save disabled until weight and reps are filled', () => {
        render(<SetRow {...base} />);
        const save = screen.getByLabelText('Save set 1');
        expect(save).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Weight set 1'), {
            target: { value: '80' },
        });
        expect(save).toBeDisabled();

        fireEvent.change(screen.getByLabelText('Reps set 1'), {
            target: { value: '8' },
        });
        expect(save).toBeEnabled();
    });

    it('reports the parsed numbers on save', () => {
        const onSave = vi.fn();
        render(
            <SetRow
                {...base}
                onSave={onSave}
            />
        );
        fireEvent.change(screen.getByLabelText('Weight set 1'), {
            target: { value: '72.5' },
        });
        fireEvent.change(screen.getByLabelText('Reps set 1'), {
            target: { value: '7' },
        });
        fireEvent.click(screen.getByLabelText('Save set 1'));
        fireEvent.click(screen.getByLabelText('Bank set 1'));
        expect(onSave).toHaveBeenCalledWith(72.5, 7, 'normal');
    });

    it('shows the stored values and marks the set as done', () => {
        render(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10 }}
            />
        );
        expect(screen.getByLabelText('Weight set 1')).toHaveValue(60);
        expect(screen.getByLabelText('Save set 1')).toHaveAttribute(
            'data-done',
            'true'
        );
    });

    it("shows last session's numbers as the placeholders", () => {
        render(
            <SetRow
                {...base}
                previous={{ weight: 80, reps: 8, week: 1 }}
            />
        );
        expect(screen.getByLabelText('Weight set 1')).toHaveAttribute(
            'placeholder',
            '80 kg'
        );
        expect(screen.getByLabelText('Reps set 1')).toHaveAttribute(
            'placeholder',
            '8 reps'
        );
    });

    it('asks how the set went before it banks it', () => {
        const onSave = vi.fn();
        render(
            <SetRow
                {...base}
                onSave={onSave}
            />
        );
        fireEvent.change(screen.getByLabelText('Weight set 1'), {
            target: { value: '80' },
        });
        fireEvent.change(screen.getByLabelText('Reps set 1'), {
            target: { value: '8' },
        });

        // First press stands both numbers aside for the question, and banks
        // nothing.
        fireEvent.click(screen.getByLabelText('Save set 1'));
        expect(onSave).not.toHaveBeenCalled();
        expect(screen.queryByLabelText('Reps set 1')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Weight set 1')).not.toBeInTheDocument();

        // Every answer on the scale is one tap, the far end included.
        fireEvent.click(screen.getByLabelText('Went to failure'));
        fireEvent.click(screen.getByLabelText('Really tough'));
        fireEvent.click(screen.getByLabelText('Bank set 1'));
        expect(onSave).toHaveBeenCalledWith(80, 8, 'hard');
        // The numbers are back once the question is answered.
        expect(screen.getByLabelText('Weight set 1')).toHaveValue(80);
        expect(screen.getByLabelText('Reps set 1')).toHaveValue(8);
    });

    it('gives the numbers back on a tap anywhere else', () => {
        render(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10 }}
            />
        );
        fireEvent.click(screen.getByLabelText('Save set 1'));
        expect(screen.queryByLabelText('Reps set 1')).not.toBeInTheDocument();

        fireEvent.mouseDown(document.body);
        expect(screen.getByLabelText('Reps set 1')).toHaveValue(10);
    });

    it('gives them back on Escape too', () => {
        render(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10 }}
            />
        );
        fireEvent.click(screen.getByLabelText('Save set 1'));
        fireEvent.keyDown(screen.getByLabelText('As planned'), {
            key: 'Escape',
        });
        expect(screen.getByLabelText('Weight set 1')).toHaveValue(60);
    });

    it('has nothing to bank when a banked set is asked and left alone', () => {
        render(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10, effort: 'normal' }}
            />
        );
        const bank = screen.getByLabelText('Save set 1');
        fireEvent.click(bank);

        // The question is up, and the set is still the one that was banked.
        expect(screen.getByRole('radiogroup')).toBeInTheDocument();
        const same = screen.getByLabelText('Bank set 1');
        expect(same).toBeDisabled();
        expect(same).toHaveAttribute('data-done', 'true');

        // Answering differently is what gives it something to do again.
        fireEvent.click(screen.getByLabelText('Really tough'));
        expect(screen.getByLabelText('Bank set 1')).toBeEnabled();
        expect(screen.getByLabelText('Bank set 1')).toHaveAttribute(
            'data-done',
            'false'
        );
    });

    // Decorative, so there is no role or label to ask for — the icon's own
    // class is the only handle it has.
    const cornerMark = (container: HTMLElement) =>
        container.querySelector('.lucide-layers');

    it('leaves a corner of the mark on a banked set, and only there', () => {
        const { container, rerender } = render(<SetRow {...base} />);
        expect(cornerMark(container)).toBeNull();

        rerender(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10, effort: 'hard' }}
            />
        );
        expect(cornerMark(container)).toBeInTheDocument();

        // While the question is up it would only repeat what is being asked.
        fireEvent.click(screen.getByLabelText('Save set 1'));
        expect(cornerMark(container)).toBeNull();
    });

    it('marks the reps box with the answer the set went in with', () => {
        const { container, rerender } = render(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10 }}
            />
        );
        // Banked before the question existed: nothing to show.
        expect(container.querySelector('.eyebrow')).toBeNull();

        rerender(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10, effort: 'easy' }}
            />
        );
        expect(screen.getByText('Had more in the tank')).toHaveClass('sr-only');
    });

    it('drops the mark while the row is edited, and gives it back', () => {
        render(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10, effort: 'hard' }}
            />
        );
        expect(screen.getByText('Really tough')).toHaveClass('sr-only');

        // The mark was about ten reps at 60. It says nothing about eleven.
        fireEvent.change(screen.getByLabelText('Reps set 1'), {
            target: { value: '11' },
        });
        expect(screen.queryByText('Really tough')).not.toBeInTheDocument();

        // And the row is the banked one again the moment the numbers are.
        fireEvent.change(screen.getByLabelText('Reps set 1'), {
            target: { value: '10' },
        });
        expect(screen.getByText('Really tough')).toHaveClass('sr-only');
    });

    it('asks an edited row from scratch rather than from the old mark', () => {
        const onSave = vi.fn();
        render(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10, effort: 'fail' }}
                onSave={onSave}
            />
        );
        fireEvent.change(screen.getByLabelText('Weight set 1'), {
            target: { value: '65' },
        });
        fireEvent.click(screen.getByLabelText('Save set 1'));

        expect(screen.getByLabelText('As planned')).toBeChecked();
        expect(screen.getByLabelText('Went to failure')).not.toBeChecked();
        fireEvent.click(screen.getByLabelText('Bank set 1'));
        expect(onSave).toHaveBeenCalledWith(65, 10, 'normal');
    });

    it("marks the placeholder with last session's answer too", () => {
        render(
            <SetRow
                {...base}
                previous={{ weight: 80, reps: 8, effort: 'easy', week: 1 }}
            />
        );
        expect(screen.getByText('Had more in the tank')).toHaveClass('sr-only');

        // It belongs to the number being offered, so it goes when that does.
        fireEvent.change(screen.getByLabelText('Reps set 1'), {
            target: { value: '8' },
        });
        expect(
            screen.queryByText('Had more in the tank')
        ).not.toBeInTheDocument();
    });

    it('does not carry a banked answer over to the next edit', () => {
        const onSave = vi.fn();
        const { rerender } = render(
            <SetRow
                {...base}
                onSave={onSave}
            />
        );
        fireEvent.change(screen.getByLabelText('Weight set 1'), {
            target: { value: '80' },
        });
        fireEvent.change(screen.getByLabelText('Reps set 1'), {
            target: { value: '8' },
        });
        fireEvent.click(screen.getByLabelText('Save set 1'));
        fireEvent.click(screen.getByLabelText('Really tough'));
        fireEvent.click(screen.getByLabelText('Bank set 1'));
        expect(onSave).toHaveBeenCalledWith(80, 8, 'hard');

        rerender(
            <SetRow
                {...base}
                saved={{ weight: 80, reps: 8, effort: 'hard' }}
                onSave={onSave}
            />
        );
        fireEvent.change(screen.getByLabelText('Weight set 1'), {
            target: { value: '85' },
        });
        fireEvent.click(screen.getByLabelText('Save set 1'));
        expect(screen.getByLabelText('As planned')).toBeChecked();
        expect(screen.getByLabelText('Really tough')).not.toBeChecked();
    });

    it('takes the answer back when the question is walked away from', () => {
        const onSave = vi.fn();
        render(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10, effort: 'normal' }}
                onSave={onSave}
            />
        );
        fireEvent.click(screen.getByLabelText('Save set 1'));
        fireEvent.click(screen.getByLabelText('Really tough'));
        expect(screen.getByLabelText('Bank set 1')).toBeEnabled();

        fireEvent.mouseDown(document.body);
        // Nothing was banked, so nothing changed: the row is settled again.
        expect(onSave).not.toHaveBeenCalled();
        expect(screen.getByLabelText('Save set 1')).toHaveAttribute(
            'data-done',
            'true'
        );

        // And asking again starts from the mark the set was banked with.
        fireEvent.click(screen.getByLabelText('Save set 1'));
        expect(screen.getByLabelText('As planned')).toBeChecked();
        expect(screen.getByLabelText('Really tough')).not.toBeChecked();
    });

    it('lets a banked set be asked again, to change the mark alone', () => {
        const onSave = vi.fn();
        render(
            <SetRow
                {...base}
                saved={{ weight: 60, reps: 10, effort: 'normal' }}
                onSave={onSave}
            />
        );
        const bank = screen.getByLabelText('Save set 1');
        expect(bank).toHaveAttribute('data-done', 'true');
        expect(bank).toBeEnabled();

        fireEvent.click(bank);
        fireEvent.click(screen.getByLabelText('Had more in the tank'));
        fireEvent.click(screen.getByLabelText('Bank set 1'));
        expect(onSave).toHaveBeenCalledWith(60, 10, 'easy');
    });

    it('translates its labels', () => {
        renderWithLocale(<SetRow {...base} />, 'es');
        expect(screen.getByLabelText('Peso serie 1')).toBeInTheDocument();
    });
});
