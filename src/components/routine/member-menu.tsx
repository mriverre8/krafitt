'use client';

import { useT } from '@/i18n/use-t';
import { menuDangerClass, menuItemClass } from '@/lib/ui';
import { ActionButton } from '@/components/ui/action-button';
import { Dropdown } from '@/components/ui/dropdown';
import { ArrowLeftRight, Ellipsis, Trash } from 'lucide-react';

export function MemberMenu({
    name,
    role,
    setRole,
    onRemove,
}: {
    name: string;
    role: string;
    setRole: (role: string) => Promise<unknown>;
    onRemove: () => Promise<unknown>;
}) {
    const t = useT();
    const other = role === 'coach' ? 'scout' : 'coach';

    return (
        <Dropdown
            label={t('members.options', { name })}
            icon={
                <Ellipsis
                    size={18}
                    aria-hidden
                />
            }
        >
            {(close) => (
                <>
                    <ActionButton
                        action={async () => {
                            close();
                            await setRole(other);
                        }}
                        className={menuItemClass}
                    >
                        <ArrowLeftRight
                            size={14}
                            aria-hidden
                        />
                        {t('members.changeTo', { role: t(`role.${other}`) })}
                    </ActionButton>
                    <ActionButton
                        action={onRemove}
                        confirm={{
                            title: t('members.removeTitle'),
                            message: t('members.removeConfirm', { name }),
                        }}
                        className={menuDangerClass}
                    >
                        <Trash
                            size={14}
                            aria-hidden
                        />
                        {t('members.removeAction')}
                    </ActionButton>
                </>
            )}
        </Dropdown>
    );
}
