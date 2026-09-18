'use client';

import { useState } from 'react';

/**
 * Hands out the address of the page you are on: the device's share sheet where
 * there is one, the clipboard where there is not.
 *
 * `copied` only ever goes true on the clipboard path — a share sheet announces
 * itself — and clears after two seconds. A cancelled share or a refused
 * clipboard lands in the catch and leaves the button as it was.
 */
export function useShare(title: string) {
    const [copied, setCopied] = useState(false);

    async function share() {
        const url = window.location.href;
        try {
            if (navigator.share) return await navigator.share({ title, url });
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    return { copied, share };
}
