'use client';

import { useT } from '@/i18n/use-t';
import { ghostClass } from '@/lib/ui';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BackButton({
    fallback,
    onBack,
}: {
    fallback: string;
    onBack?: () => void;
}) {
    const t = useT();
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() =>
                onBack
                    ? onBack()
                    : window.history.length > 1
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
