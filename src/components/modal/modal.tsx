'use client';

import { useT } from '@/i18n/use-t';
import { iconButtonClass } from '@/lib/ui';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';

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

    useEffect(() => {
        ref.current?.showModal();
    }, []);

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
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
