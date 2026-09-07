'use client';

import { useT } from '@/i18n/use-t';
import { authClient } from '@/lib/auth-client';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
    const t = useT();
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={async () => {
                await authClient.signOut();
                router.refresh();
            }}
            aria-label={t('nav.signOut')}
            title={t('nav.signOut')}
            className="text-muted hover:bg-surface2 hover:text-blaze rounded-lg p-1.5 transition-colors"
        >
            <LogOut
                size={16}
                aria-hidden
            />
        </button>
    );
}
