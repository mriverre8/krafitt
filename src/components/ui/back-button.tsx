'use client';

import { useT } from '@/i18n/use-t';
import { ghostClass } from '@/lib/ui';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Returns to wherever the user came from. Opened cold — a shared link, a new
 * tab, a refresh — there is no previous entry to go back to, so `fallback`
 * takes over and the button is never dead.
 */
export function BackButton({ fallback }: { fallback: string }) {
    const t = useT();
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() =>
                window.history.length > 1
                    ? router.back()
                    : router.push(fallback)
            }
            className={`${ghostClass} mb-4 inline-flex items-center justify-center gap-2`}
        >
            <ArrowLeft
                size={14}
                aria-hidden
            />
            {t('nav.back')}
        </button>
    );
}
