'use client';

import { useT } from '@/i18n/use-t';
import type { FormAction } from '@/lib/forms';
import { menuDangerClass, menuItemClass } from '@/lib/ui';
import { showModal } from '@/store/modal';
import { Ellipsis, Trash, Type } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { Dropdown } from '@/components/ui/dropdown';

/**
 * The day's name as the screen's heading, and in edit mode the menu that
 * renames it or, while the routine has not started, deletes it.
 */
export function DayHeader({
    name,
    editing,
    onRename,
    onDelete,
}: {
    name: string;
    editing: boolean;
    onRename: FormAction;
    /** Already bound to this day. */
    onDelete?: () => Promise<void>;
}) {
    const t = useT();
    return (
        <div className="flex items-center justify-between gap-3">
            <h3 className="display line-clamp-2 min-w-0 text-4xl leading-none">
                {name}
            </h3>
            {editing && (
                <Dropdown
                    label={t('routine.dayOptions')}
                    icon={
                        <Ellipsis
                            size={18}
                            aria-hidden
                        />
                    }
                >
                    {(close) => (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    close();
                                    showModal('rename', {
                                        name,
                                        rename: onRename,
                                        title: t('routine.renameDay'),
                                        label: t('routine.dayLabel'),
                                    });
                                }}
                                className={menuItemClass}
                            >
                                <Type
                                    size={14}
                                    aria-hidden
                                />
                                {t('routine.renameDay')}
                            </button>
                            {onDelete && (
                                <ActionButton
                                    action={onDelete}
                                    confirm={{
                                        title: t('routine.deleteDay'),
                                        message: t('routine.deleteDayConfirm', {
                                            name,
                                        }),
                                    }}
                                    className={menuDangerClass}
                                >
                                    <Trash
                                        size={14}
                                        aria-hidden
                                    />
                                    {t('routine.deleteDay')}
                                </ActionButton>
                            )}
                        </>
                    )}
                </Dropdown>
            )}
        </div>
    );
}
