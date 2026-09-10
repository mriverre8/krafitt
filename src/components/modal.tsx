'use client';

import { useT } from '@/i18n/use-t';
import { iconButtonClass } from '@/lib/ui';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * The app's one modal shell. It owns the frame, the title and every way out,
 * and knows nothing about what is being asked — every modal is its children:
 *
 *     export function ConfirmModal({ title, onClose }: ConfirmModalProps) {
 *         return (
 *             <Modal title={title} onClose={onClose}>
 *                 ...
 *             </Modal>
 *         );
 *     }
 *
 * Nothing renders this directly. The ModalHost mounts whichever modal the store
 * says is open and hands it the onClose that clears it, so rendered is the same
 * thing as open: no `open` prop, and mounting is the whole lifecycle.
 *
 * Built on <dialog>, not a div with a fixed overlay: the browser already gives
 * the top layer, the backdrop, the focus trap, Escape and an inert page behind
 * — all of it more correct than a hand-rolled version and none of it ours to
 * keep working.
 *
 * Speaks the same shell language as the cards — tight radius, one thick volt
 * rule down the left — a weight up from them, so a modal reads as this app's
 * surface rather than browser chrome dropped on top of it.
 */
export function Modal({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: ReactNode;
}) {
    const t = useT();
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    // showModal(), never the open attribute: only the call puts the dialog in
    // the top layer with a backdrop and the page behind it inert.
    useEffect(() => {
        ref.current?.showModal();
    }, []);

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            // Escape closes through the host rather than behind its back: the
            // native close would leave this mounted and invisible with the
            // store still saying it is open, and nothing left to reopen it.
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            // The card fills the dialog edge to edge, so a click that lands on
            // the dialog itself came from the backdrop — except on its own
            // scrollbar, which counts as the dialog too. Nothing here is long
            // enough to grow one yet; the day a modal is, this needs to test
            // the click against the dialog's box instead of its target.
            onClick={(event) => {
                if (event.target === ref.current) onClose();
            }}
            className="border-line border-l-volt bg-surface text-ink m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-md border-2 border-l-[6px] p-0 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-xs"
        >
            <div className="space-y-5 p-6">
                <div className="flex items-start justify-between gap-4">
                    <h2
                        id={titleId}
                        className="display text-ink text-4xl"
                    >
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t('common.close')}
                        className={`${iconButtonClass} -mt-1.5 -mr-1.5`}
                    >
                        <X
                            size={18}
                            aria-hidden
                        />
                    </button>
                </div>
                {children}
            </div>
        </dialog>
    );
}
