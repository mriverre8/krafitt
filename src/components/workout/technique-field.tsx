'use client';

import { Dropdown } from '@/components/ui/dropdown';
import { useT } from '@/i18n/use-t';
import { TECHNIQUES } from '@/lib/constants';
import { menuDangerClass, menuItemClass } from '@/lib/ui';
import { Check, ChevronDown, Plus, Type, X } from 'lucide-react';

/**
 * A set's technique, picked beside the set's name rather than from a slot on
 * its row: most sets never get one, and a slot for it put a line under the
 * reps of every set on a phone. Empty, it offers to add one; holding one, it
 * names it, and opens the same list to swap it or take it off.
 *
 * Custom does not hand the set a blank any more. It asks the card to write
 * one (`onWrite`), which swaps the set's fields for `TechniqueInput` until the
 * name is confirmed — so a set is never left holding a technique with no name.
 * While that box is open (`writing`), Custom is what the set is getting: the
 * head says so, and the list shows it picked.
 */
export function TechniqueField({
    exerciseNumber,
    setLabel,
    technique,
    wrong,
    onChange,
    onWrite,
    writing = false,
}: {
    exerciseNumber: number;
    setLabel: string;
    technique: string | null;
    wrong: boolean;
    onChange: (technique: string | null) => void;
    /** Custom was picked: write a name, starting from the one it already has. */
    onWrite: (start: string) => void;
    /** A custom name is being written for this set right now. */
    writing?: boolean;
}) {
    const t = useT();
    const presets: string[] = TECHNIQUES.map((key) => t(`technique.${key}`));
    // The name of one the user wrote, or nothing: a preset, none at all, or a
    // blank left by a save from before Custom asked for a name.
    const custom =
        technique !== null && !presets.includes(technique) ? technique : '';
    const customPicked = writing || !!custom;
    const named = writing ? t('technique.custom') : technique;

    return (
        <Dropdown
            label={t('exercise.techniqueMenu', {
                exercise: exerciseNumber,
                set: setLabel,
            })}
            align="left"
            className={`eyebrow hover:text-pulse -my-3 flex min-h-11 items-center gap-1 rounded-md px-1 transition-colors md:-my-2 md:min-h-9 ${
                wrong && !writing
                    ? 'text-danger'
                    : named === null
                      ? 'text-muted'
                      : 'text-ink'
            }`}
            icon={
                named === null ? (
                    <>
                        <Plus
                            size={12}
                            aria-hidden
                        />
                        {t('exercise.addTechnique')}
                    </>
                ) : (
                    <>
                        <span className="max-w-40 truncate">
                            {named || t('technique.custom')}
                        </span>
                        <ChevronDown
                            size={12}
                            aria-hidden
                            className="shrink-0"
                        />
                    </>
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
                            aria-pressed={!writing && technique === preset}
                            className={`${menuItemClass} aria-pressed:text-pulse`}
                        >
                            {preset}
                            {!writing && technique === preset && (
                                <Check
                                    size={14}
                                    aria-hidden
                                    className="ml-auto"
                                />
                            )}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            close();
                            if (!writing) onWrite(custom);
                        }}
                        aria-pressed={customPicked}
                        className={`${menuItemClass} aria-pressed:text-pulse`}
                    >
                        <Type
                            size={14}
                            aria-hidden
                            className="shrink-0"
                        />
                        <span className="min-w-0 truncate">
                            {(!writing && custom) || t('technique.custom')}
                        </span>
                        {customPicked && (
                            <Check
                                size={14}
                                aria-hidden
                                className="ml-auto shrink-0"
                            />
                        )}
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
                            className={menuDangerClass}
                        >
                            <X
                                size={14}
                                aria-hidden
                            />
                            {t('exercise.removeTechnique')}
                        </button>
                    )}
                </>
            )}
        </Dropdown>
    );
}
