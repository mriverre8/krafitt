'use client';

import { useT } from '@/i18n/use-t';
import type { FormAction } from '@/lib/forms';
import { labelClass, menuDangerClass, menuItemClass } from '@/lib/ui';
import { showModal } from '@/store/modal';
import { Dropdown } from '@/components/ui/dropdown';
import { DeleteRoutineButton } from '@/components/routine/delete-routine-button';
import { EditModeToggle } from '@/components/routine/edit-mode';
import { Ellipsis, Type } from 'lucide-react';

export function RoutineOptions({
    name,
    rename,
    onDelete,
    editable,
}: {
    name: string;
    rename?: FormAction;
    onDelete: () => Promise<unknown>;
    editable: boolean;
}) {
    const t = useT();

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
