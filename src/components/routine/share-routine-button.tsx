'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass } from '@/lib/ui';
import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

export function ShareRoutineButton({ name }: { name: string }) {
    const t = useT();
    const [copied, setCopied] = useState(false);

    async function share() {
        const url = window.location.href;
        try {
            if (navigator.share)
                return await navigator.share({ title: name, url });
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    return (
        <button
            type="button"
            onClick={share}
            className={`${badgeClass} lift border-2 transition-colors ${
                copied
                    ? 'border-surge text-surge'
                    : 'border-line text-muted hover:border-pulse hover:text-pulse'
            }`}
        >
            {copied ? (
                <Check
                    size={13}
                    aria-hidden
                />
            ) : (
                <Share2
                    size={13}
                    aria-hidden
                />
            )}
            {t(copied ? 'routine.copied' : 'routine.share')}
        </button>
    );
}
