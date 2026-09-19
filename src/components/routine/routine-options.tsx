'use client';

import { useT } from '@/i18n/use-t';
import type { FormAction } from '@/lib/forms';
import { labelClass, menuDangerClass, menuItemClass } from '@/lib/ui';
import { showModal } from '@/store/modal';
import { ActionButton } from '@/components/ui/action-button';
import { Dropdown } from '@/components/ui/dropdown';
import { DeleteRoutineButton } from '@/components/routine/delete-routine-button';
import { EditModeToggle } from '@/components/routine/edit-mode';
import { CalendarRange, Ellipsis, Globe, Lock, Type } from 'lucide-react';

export function RoutineOptions({
    name,
    rename,
    duration,
    onDelete,
    editable,
    isPublic,
    setVisibility,
}: {
    name: string;
    rename?: FormAction;
    duration?: { weeks: number; min: number; save: FormAction };
    onDelete: () => Promise<unknown>;
    editable: boolean;
    isPublic: boolean;
    setVisibility: (isPublic: boolean) => Promise<unknown>;
}) {
    const t = useT();

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
                    {duration && (
                        <button
                            type="button"
                            onClick={() => {
                                close();
                                showModal('duration', {
                                    durationWeeks: duration.weeks,
                                    min: duration.min,
                                    save: duration.save,
                                });
                            }}
                            className={menuItemClass}
                        >
                            <CalendarRange
                                size={14}
                                aria-hidden
                            />
                            {t('routine.duration')}
                        </button>
                    )}
                    {editable && (
                        <EditModeToggle
                            className={menuItemClass}
                            onClick={close}
                        />
                    )}
                    <ActionButton
                        action={async () => {
                            close();
                            await setVisibility(!isPublic);
                        }}
                        className={menuItemClass}
                    >
                        {isPublic ? (
                            <Lock
                                size={14}
                                aria-hidden
                            />
                        ) : (
                            <Globe
                                size={14}
                                aria-hidden
                            />
                        )}
                        {t(
                            isPublic
                                ? 'routine.makePrivate'
                                : 'routine.makePublic'
                        )}
                    </ActionButton>
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
