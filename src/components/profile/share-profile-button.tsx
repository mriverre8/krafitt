'use client';

import { useT } from '@/i18n/use-t';
import { ghostClass } from '@/lib/ui';
import { useShare } from '@/hooks/use-share';
import { Check, Share2 } from 'lucide-react';

export function ShareProfileButton({ name }: { name: string }) {
    const t = useT();
    const { copied, share } = useShare(name);

    return (
        <button
            type="button"
            onClick={share}
            className={`${ghostClass} flex w-full items-center justify-center gap-2 py-1.5! transition-colors md:py-2.5! ${
                copied ? 'border-surge! text-surge!' : ''
            }`}
        >
            {copied ? (
                <Check
                    size={14}
                    aria-hidden
                />
            ) : (
                <Share2
                    size={14}
                    aria-hidden
                />
            )}
            {t(copied ? 'common.copied' : 'common.share')}
        </button>
    );
}
