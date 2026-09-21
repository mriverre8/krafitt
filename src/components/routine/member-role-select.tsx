'use client';

import { useT } from '@/i18n/use-t';
import { ASSIGNABLE } from '@/lib/roles';
import { fieldClass } from '@/lib/ui';
import { useTransition } from 'react';

export function MemberRoleSelect({
    name,
    role,
    setRole,
}: {
    name: string;
    role: string;
    setRole: (role: string) => Promise<unknown>;
}) {
    const t = useT();
    const [pending, startTransition] = useTransition();

    return (
        <select
            value={role}
            disabled={pending}
            onChange={(event) => {
                const next = event.target.value;
                startTransition(async () => {
                    await setRole(next);
                });
            }}
            aria-label={t('members.roleLabel', { name })}
            className={`${fieldClass} w-28 shrink-0 px-2 py-2 text-sm md:w-32`}
        >
            {ASSIGNABLE.map((value) => (
                <option
                    key={value}
                    value={value}
                >
                    {t(`role.${value}`)}
                </option>
            ))}
        </select>
    );
}
