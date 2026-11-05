'use client';

import { useT } from '@/i18n/use-t';
import { USER_NAME_MAX } from '@/lib/constants';
import { fieldClass, rowFieldClass } from '@/lib/ui';
import { Check, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Writing a custom technique, in place of the set's own fields: the reps step
 * aside while the name is typed, and come back once it is confirmed or let
 * go. Confirm stays shut on a blank — a technique has to be called something.
 * Enter confirms and Escape lets go, for a keyboard.
 */
export function TechniqueInput({
    exerciseNumber,
    setLabel,
    start,
    onConfirm,
    onCancel,
}: {
    exerciseNumber: number;
    setLabel: string;
    /** The name it opens on: the one the set already has, or nothing. */
    start: string;
    onConfirm: (technique: string) => void;
    onCancel: () => void;
}) {
    const t = useT();
    const [text, setText] = useState(start);
    const name = text.trim();
    const confirm = () => name && onConfirm(name);
    const label = { exercise: exerciseNumber, set: setLabel };

    return (
        <div className="flex items-center gap-1.5 md:gap-2">
            <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') confirm();
                    if (event.key === 'Escape') onCancel();
                }}
                autoFocus
                maxLength={USER_NAME_MAX}
                placeholder={t('exercise.techniquePlaceholder')}
                aria-label={t('exercise.technique', label)}
                className={`${fieldClass} ${rowFieldClass} min-w-0 flex-1`}
            />
            <button
                type="button"
                onClick={onCancel}
                aria-label={t('exercise.cancelTechnique', label)}
                className={`border-line text-muted hover:border-danger hover:text-danger flex ${rowFieldClass} w-12 shrink-0 items-center justify-center rounded-md border-2 transition-colors`}
            >
                <X
                    size={18}
                    aria-hidden
                />
            </button>
            <button
                type="button"
                disabled={!name}
                onClick={confirm}
                aria-label={t('exercise.confirmTechnique', label)}
                className={`bg-volt text-on-volt hover:bg-volt2 flex ${rowFieldClass} w-12 shrink-0 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-40`}
            >
                <Check
                    size={18}
                    aria-hidden
                />
            </button>
        </div>
    );
}
