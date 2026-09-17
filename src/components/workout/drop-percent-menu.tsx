'use client';

import { Dropdown } from '@/components/ui/dropdown';
import { useT } from '@/i18n/use-t';
import {
    dashedActionClass,
    menuItemClass,
    numberClass,
    rowFieldClass,
    valueSlotClass,
} from '@/lib/ui';
import { Plus } from 'lucide-react';

const DROP_VALUES = [10, 20, 30, 40, 50];

/**
 * How much weight a drop set takes off the set it hangs from, in the column
 * that set's own amount occupies. Picked rather than typed: five round numbers
 * cover what anyone actually programmes, and a menu saves the keyboard.
 *
 * Two states, one column wide in both. Empty is a dashed slot showing the unit
 * alone — the row above it already says the set is a drop — and pressing it
 * opens the list; filled is a field-looking slot saying the number, and
 * pressing it opens the same list again, so changing one is picking afresh.
 *
 * Never painted as wrong: a drop with no per cent trains fine, so `badSetValue`
 * passes it and the routine never holds it against the day. That is also why
 * the way back to nothing is on the list at all, and only once there is
 * something to take off.
 */
export function DropPercentMenu({
    e,
    n,
    value,
    onChange,
}: {
    /** The exercise's number in the day, and the row's name inside it (`DS1`).
        A day holds several cards, so neither one alone names the control. */
    e: number;
    n: string;
    /** Blank until the drop has been sized. */
    value: string;
    onChange: (value: string) => void;
}) {
    const t = useT();
    const unit = t('set.dropUnit');

    return (
        <Dropdown
            label={t('exercise.setValue', { e, label: n })}
            className={
                value
                    ? `${numberClass(false)} ${valueSlotClass}`
                    : `${dashedActionClass} ${rowFieldClass} ${valueSlotClass} px-1`
            }
            icon={
                value ? (
                    `${value}${unit}`
                ) : (
                    <>
                        <Plus
                            size={14}
                            aria-hidden
                        />
                        {unit}
                    </>
                )
            }
        >
            {(close) => (
                <>
                    {DROP_VALUES.map((percent) => (
                        <button
                            key={percent}
                            type="button"
                            onClick={() => {
                                onChange(String(percent));
                                close();
                            }}
                            className={menuItemClass}
                        >
                            {`${percent}${unit}`}
                        </button>
                    ))}
                    {value !== '' && (
                        <button
                            type="button"
                            onClick={() => {
                                onChange('');
                                close();
                            }}
                            className={menuItemClass}
                        >
                            {t('exercise.unspecified')}
                        </button>
                    )}
                </>
            )}
        </Dropdown>
    );
}
