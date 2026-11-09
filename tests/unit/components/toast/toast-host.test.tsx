import { ToastHost } from '@/components/toast/toast-host';
import { toast, useToastStore } from '@/store/toast';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const leaving = () => useToastStore.getState().toasts[0]?.leaving;

/** jsdom plays no animations and has no AnimationEvent, which is why React
    listens for the webkit-prefixed name there. */
function animationEnd(element: Element, animationName: string) {
    const event = Object.assign(
        new Event('webkitAnimationEnd', { bubbles: true }),
        { animationName }
    );
    act(() => {
        element.dispatchEvent(event);
    });
}

describe('ToastHost', () => {
    it('stacks the newest toast on top', () => {
        const { container } = render(<ToastHost />);
        act(() => {
            toast('First');
            toast('Second', 'error');
        });
        const [top, bottom] = container.querySelectorAll('li');
        expect(top).toHaveTextContent('Second');
        expect(top).toHaveAttribute('role', 'alert');
        expect(bottom).toHaveTextContent('First');
        expect(bottom).toHaveAttribute('role', 'status');
    });

    it('starts the way out when tapped', () => {
        render(<ToastHost />);
        act(() => toast('Saved'));
        fireEvent.click(screen.getByText('Saved'));
        expect(leaving()).toBe(true);
    });

    // The timer running out is what sends a toast away, and its row closing
    // is what takes it off.
    it('leaves when its timer runs out, and goes once its row has closed', () => {
        const { container } = render(<ToastHost />);
        act(() => toast('Saved'));

        animationEnd(container.querySelector('.toast-timer')!, 'toast-timer');
        expect(leaving()).toBe(true);

        animationEnd(screen.getByRole('status'), 'toast-collapse');
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
});
