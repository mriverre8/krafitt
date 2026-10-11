'use client';

import { TOAST_MS, useToastStore } from '@/store/toast';
import { CircleAlert, CircleCheck } from 'lucide-react';

/** The card's left rule in the colour of what happened, the way a card in the
    app turns surge once done and danger once wrong. An error reads in danger,
    like a `FormError`; anything else in ink, with the mark in surge. */
const tone = {
    success: {
        rule: 'border-l-surge',
        mark: 'text-surge-ink',
        text: 'text-ink',
        bar: 'bg-surge',
        Icon: CircleCheck,
    },
    error: {
        rule: 'border-l-danger',
        mark: 'text-danger',
        text: 'text-danger',
        bar: 'bg-danger',
        Icon: CircleAlert,
    },
};

/**
 * Newest on top: the stack hangs from the bottom edge, so a toast added above
 * moves nothing that is already there, and the oldest — the first to go —
 * leaves from the bottom while the rest settle down into its place.
 *
 * A card, floating the way the bottom bar does: the same frosted surface, top
 * highlight and drop shadow, so the two read as one layer above the page.
 */
export function ToastHost() {
    const toasts = useToastStore((s) => s.toasts);
    const dismiss = useToastStore((s) => s.dismiss);
    const remove = useToastStore((s) => s.remove);

    return (
        <ol
            aria-live="polite"
            className="standalone:max-md:bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4rem)] pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-sm flex-col"
        >
            {[...toasts].reverse().map(({ id, message, kind, leaving }) => {
                const { rule, mark, text, bar, Icon } = tone[kind];
                return (
                    <li
                        key={id}
                        role={kind === 'error' ? 'alert' : 'status'}
                        data-leaving={leaving}
                        onAnimationEnd={(event) => {
                            if (event.animationName === 'toast-collapse')
                                remove(id);
                        }}
                        className="toast"
                    >
                        <div>
                            <div className="pt-2">
                                <div
                                    onClick={() => dismiss(id)}
                                    className={`${rule} toast-slab border-line bg-surface/85 pointer-events-auto relative flex cursor-pointer touch-manipulation items-start gap-2.5 overflow-hidden rounded-md border border-l-[3px] px-3.5 pt-3 pb-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_8px_24px_rgb(0_0_0/0.18)] backdrop-blur-lg backdrop-saturate-150 select-none`}
                                >
                                    <Icon
                                        size={16}
                                        aria-hidden
                                        className={`${mark} mt-0.5 shrink-0`}
                                    />
                                    <p
                                        className={`${text} min-w-0 flex-1 text-sm leading-snug font-semibold`}
                                    >
                                        {message}
                                    </p>
                                    <span
                                        aria-hidden
                                        onAnimationEnd={() => dismiss(id)}
                                        style={
                                            {
                                                '--toast-ms': `${TOAST_MS[kind]}ms`,
                                            } as React.CSSProperties
                                        }
                                        className={`${bar} toast-timer absolute inset-x-0 bottom-0 h-0.5 origin-left`}
                                    />
                                </div>
                            </div>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
