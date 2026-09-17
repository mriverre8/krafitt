'use client';

import { Dropdown } from '@/components/ui/dropdown';
import { useT } from '@/i18n/use-t';
import { USER_NAME_MAX } from '@/lib/constants';
import {
    dashedActionClass,
    fieldClass,
    menuItemClass,
    rowFieldClass,
    wrongFieldClass,
} from '@/lib/ui';
import { Plus, Type, X } from 'lucide-react';

const TECHNIQUES = ['warmup', 'linear', 'topset', 'backoff'] as const;

const techniqueSlotClass =
    'relative mt-1.5 min-w-40 basis-full md:mt-0 md:min-w-0 md:flex-1 md:basis-auto';

export function TechniqueField({
    exerciseNumber,
    setLabel,
    technique,
    wrong,
    onChange,
}: {
    exerciseNumber: number;
    setLabel: string;
    technique: string | null;
    wrong: boolean;
    onChange: (technique: string | null) => void;
}) {
    const t = useT();
    const presets: string[] = TECHNIQUES.map((key) => t(`technique.${key}`));
    const written = technique !== null && !presets.includes(technique);

    if (written)
        return (
            <div className={techniqueSlotClass}>
                <input
                    value={technique}
                    onChange={(event) => onChange(event.target.value)}
                    maxLength={USER_NAME_MAX}
                    placeholder={t('exercise.techniquePlaceholder')}
                    aria-label={t('exercise.technique', {
                        exercise: exerciseNumber,
                        set: setLabel,
                    })}
                    className={`${
                        wrong ? wrongFieldClass : fieldClass
                    } ${rowFieldClass} w-full pr-12`}
                />
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    aria-label={t('exercise.removeTechniqueLabel', {
                        exercise: exerciseNumber,
                        set: setLabel,
                    })}
                    className="text-muted hover:text-danger absolute top-1/2 right-0.5 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-md transition-colors md:min-h-9 md:min-w-9"
                >
                    <X
                        size={14}
                        aria-hidden
                    />
                </button>
            </div>
        );

    return (
        <div className={techniqueSlotClass}>
            <Dropdown
                label={t('exercise.techniqueMenu', {
                    exercise: exerciseNumber,
                    set: setLabel,
                })}
                align="right"
                className={
                    technique === null
                        ? `${dashedActionClass} ${rowFieldClass} w-full px-3`
                        : `${wrong ? wrongFieldClass : fieldClass} ${rowFieldClass} flex w-full items-center`
                }
                icon={
                    technique === null ? (
                        <>
                            <Plus
                                size={14}
                                aria-hidden
                            />
                            {t('exercise.noTechnique')}
                        </>
                    ) : (
                        technique
                    )
                }
            >
                {(close) => (
                    <>
                        {presets.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                    onChange(preset);
                                    close();
                                }}
                                className={menuItemClass}
                            >
                                {preset}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                onChange('');
                                close();
                            }}
                            className={menuItemClass}
                        >
                            <Type
                                size={14}
                                aria-hidden
                            />
                            {t('technique.custom')}
                        </button>
                        {technique !== null && (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(null);
                                    close();
                                }}
                                aria-label={t('exercise.removeTechniqueLabel', {
                                    exercise: exerciseNumber,
                                    set: setLabel,
                                })}
                                className={menuItemClass}
                            >
                                {t('exercise.unspecified')}
                            </button>
                        )}
                    </>
                )}
            </Dropdown>
        </div>
    );
}
