'use client';

import { useT } from '@/i18n/use-t';
import type { Problem } from '@/lib/validate';
import { cardClass, labelClass } from '@/lib/ui';
import { TriangleAlert } from 'lucide-react';

/**
 * What the day is still missing, as last saved, with the switch that paints
 * the offending fields on the cards below.
 */
export function ProblemsCard({
    problems,
    highlight,
    onToggle,
    className = '',
}: {
    problems: Problem[];
    highlight: boolean;
    onToggle: () => void;
    className?: string;
}) {
    const t = useT();
    return (
        <div className={`${cardClass} border-l-danger ${className}`}>
            <div className="text-danger flex items-center gap-2">
                <TriangleAlert
                    size={16}
                    aria-hidden
                    className="shrink-0"
                />
                <p className="eyebrow">
                    {problems.length === 1
                        ? t('validate.problem')
                        : t('validate.problems', { n: problems.length })}
                </p>
                <button
                    type="button"
                    onClick={onToggle}
                    aria-pressed={highlight}
                    className={`${labelClass} hover:text-pulse ml-auto shrink-0 py-1 transition-colors`}
                >
                    {t(
                        highlight
                            ? 'validate.hideFields'
                            : 'validate.showFields'
                    )}
                </button>
            </div>
            <ul className="text-muted mt-3 space-y-1.5 text-sm">
                {problems.map(({ where, what }, index) => (
                    <li key={index}>
                        <span className="text-ink font-semibold">{where}</span>:{' '}
                        {what}
                    </li>
                ))}
            </ul>
        </div>
    );
}
