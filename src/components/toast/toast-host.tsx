'use client';

import { useT } from '@/i18n/use-t';
import { useToastStore } from '@/store/toast';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

const kindClass = {
    success: 'border-surge-ink text-ink',
    error: 'border-danger text-danger',
};

export function ToastHost() {
    const t = useT();
    const toasts = useToastStore((s) => s.toasts);
    const dismiss = useToastStore((s) => s.dismiss);

    return (
        <ol
            aria-live="polite"
            className="standalone:max-md:bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4rem)] pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md flex-col gap-2"
        >
            {toasts.map(({ id, message, kind }) => {
                const Icon = kind === 'error' ? CircleAlert : CircleCheck;
                return (
                    <li
                        key={id}
                        role={kind === 'error' ? 'alert' : 'status'}
                        className={`${kindClass[kind]} bg-surface pointer-events-auto flex items-center gap-3 rounded-md border-2 px-4 py-3 text-sm font-semibold shadow-[0_8px_24px_rgb(0_0_0/0.18)]`}
                    >
                        <Icon
                            size={16}
                            aria-hidden
                            className="shrink-0"
                        />
                        <span className="min-w-0 flex-1">{message}</span>
                        <button
                            type="button"
                            onClick={() => dismiss(id)}
                            aria-label={t('common.close')}
                            className="text-muted hover:text-ink shrink-0 transition-colors"
                        >
                            <X
                                size={16}
                                aria-hidden
                            />
                        </button>
                    </li>
                );
            })}
        </ol>
    );
}
