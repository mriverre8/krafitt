'use client';

import { useT } from '@/i18n/use-t';
import { ghostClass } from '@/lib/ui';
import { CircleCheck, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

/**
 * The problems are computed on the server with the page, so the button only has
 * to reveal them: it answers "can I activate this yet?" without a round trip.
 */
export function ValidateRoutine({ problems }: { problems: string[] }) {
    const t = useT();
    const [checked, setChecked] = useState(false);

    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => setChecked(true)}
                className={`${ghostClass} flex items-center gap-2`}
            >
                <ShieldCheck
                    size={14}
                    aria-hidden
                />
                {t('validate.button')}
            </button>

            {checked && problems.length === 0 && (
                <p className="text-pulse flex items-center gap-2 text-sm font-semibold">
                    <CircleCheck
                        size={16}
                        aria-hidden
                    />
                    {t('validate.ok')}
                </p>
            )}

            {checked && problems.length > 0 && (
                <div>
                    <p className="eyebrow text-danger">{t('validate.title')}</p>
                    <ul className="text-danger mt-2 list-disc space-y-1 pl-5 text-sm">
                        {problems.map((problem, index) => (
                            <li key={index}>{problem}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
