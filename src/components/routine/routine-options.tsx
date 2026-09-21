'use client';

import { useT } from '@/i18n/use-t';
import type { FormAction } from '@/lib/forms';
import { labelClass, menuDangerClass, menuItemClass } from '@/lib/ui';
import { showModal } from '@/store/modal';
import { ActionButton } from '@/components/ui/action-button';
import { Dropdown } from '@/components/ui/dropdown';
import { DeleteRoutineButton } from '@/components/routine/delete-routine-button';
import { EditModeToggle } from '@/components/routine/edit-mode';
import {
    CalendarRange,
    Ellipsis,
    Globe,
    Lock,
    LogOut,
    Type,
    Users,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Everything a routine can be done to from its own header. Which rows appear is
 * the page's call, not this one's: a coach is handed the same menu with the
 * owner's rows left out, so there is one menu rather than two to keep in step.
 */
export function RoutineOptions({
    name,
    rename,
    duration,
    people,
    onLeave,
    onDelete,
    editable,
    isPublic,
    setVisibility,
}: {
    name: string;
    rename?: FormAction;
    duration?: { weeks: number; min: number; save: FormAction };
    /** Where the people of this routine are managed, and how many are in it.
        The owner's, and only theirs: who else is watching is the owner's
        business to keep. */
    people?: { href: string; count: number };
    /** For anyone who was let in: nobody is put on a routine with their
        say-so, so walking out is what makes that acceptable. */
    onLeave?: () => Promise<unknown>;
    /** Absent for anyone but the owner: deleting and sharing are theirs. */
    onDelete?: () => Promise<unknown>;
    editable: boolean;
    isPublic?: boolean;
    setVisibility?: (isPublic: boolean) => Promise<unknown>;
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
                    {people && (
                        <Link
                            href={people.href}
                            onClick={close}
                            className={menuItemClass}
                        >
                            <Users
                                size={14}
                                aria-hidden
                            />
                            {/* No "(0)": a count is there to say how many,
                                and none of them is what the page itself
                                says when you open it. */}
                            {t(
                                people.count > 0
                                    ? 'members.linkCount'
                                    : 'members.link',
                                { count: people.count }
                            )}
                        </Link>
                    )}
                    {setVisibility && (
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
                    )}
                    {onLeave && (
                        <ActionButton
                            action={onLeave}
                            confirm={{
                                title: t('members.leaveTitle'),
                                message: t('members.leaveConfirm', { name }),
                                confirmLabel: t('members.leave'),
                            }}
                            className={menuDangerClass}
                        >
                            <LogOut
                                size={14}
                                aria-hidden
                            />
                            {t('members.leave')}
                        </ActionButton>
                    )}
                    {onDelete && (
                        <DeleteRoutineButton
                            name={name}
                            onDelete={onDelete}
                            className={menuDangerClass}
                        />
                    )}
                </>
            )}
        </Dropdown>
    );
}
