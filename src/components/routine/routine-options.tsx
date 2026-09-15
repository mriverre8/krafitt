'use client';

import { useT } from '@/i18n/use-t';
import type { FormAction } from '@/lib/forms';
import { labelClass, menuDangerClass, menuItemClass } from '@/lib/ui';
import { showModal } from '@/store/modal';
import { Dropdown } from '@/components/ui/dropdown';
import { DeleteRoutineButton } from '@/components/routine/delete-routine-button';
import { EditModeToggle } from '@/components/routine/edit-mode';
import { Ellipsis, Type } from 'lucide-react';

/**
 * Everything you can do to the routine as a whole, behind one trigger: the
 * rename that has nowhere else to live — the name is a heading on this page,
 * not a field — entering edit mode, and deleting the lot.
 *
 * Only ever rendered out of edit mode: on the way in, the page swaps the whole
 * menu for the bare Done, so nothing routine-level is one click away while
 * there are unsaved days on screen.
 *
 * Styled as the small text button it replaces, so it still reads as page
 * furniture rather than as the bar's icon menu.
 */
export function RoutineOptions({
    name,
    rename,
    onDelete,
    editable,
}: {
    name: string;
    /** Already bound to its routine. Left out once the routine is finished:
        by then it is a record of training done, and the name is part of it. */
    rename?: FormAction;
    /** Already bound to its routine. */
    onDelete: () => Promise<unknown>;
    /** A routine with sessions logged against it is read-only, and offers no
        way into edit mode at all. */
    editable: boolean;
}) {
    const t = useT();

    // Delete is the one row always here, so with the other two gone there is
    // nothing for a menu to hold: it stands on its own instead.
    if (!rename && !editable)
        return (
            <DeleteRoutineButton
                name={name}
                onDelete={onDelete}
            />
        );

    return (
        <Dropdown
            label={t('routine.options')}
            className={`${labelClass} hover:text-pulse flex shrink-0 items-center gap-1.5 py-1 transition-colors`}
            icon={
                <>
                    <Ellipsis
                        size={14}
                        aria-hidden
                    />
                    {t('routine.options')}
                </>
            }
        >
            {(close) => (
                <>
                    {rename && (
                        <button
                            type="button"
                            onClick={() => {
                                close();
                                showModal('rename', {
                                    name,
                                    rename,
                                    title: t('routine.rename'),
                                    label: t('routines.nameLabel'),
                                });
                            }}
                            className={menuItemClass}
                        >
                            <Type
                                size={14}
                                aria-hidden
                            />
                            {t('routine.rename')}
                        </button>
                    )}
                    {editable && (
                        <EditModeToggle
                            className={menuItemClass}
                            onClick={close}
                        />
                    )}
                    <DeleteRoutineButton
                        name={name}
                        onDelete={onDelete}
                        className={menuDangerClass}
                    />
                </>
            )}
        </Dropdown>
    );
}
