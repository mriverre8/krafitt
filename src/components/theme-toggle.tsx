'use client';

import { useT } from '@/i18n/use-t';
import { setPreferenceCookie } from '@/lib/cookies';
import { THEME_COOKIE, type Theme } from '@/lib/theme';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

/**
 * Flips the <html> class straight away and stores the choice in a cookie so the
 * server renders the same theme on the next request.
 */
export function ThemeToggle({ theme }: { theme: Theme }) {
    const t = useT();
    // The <html> class is the live source of truth. This component unmounts every
    // time the settings menu closes, so a copy of the prop would come back stale
    // after the first flip; the prop is only the fallback for the server render.
    const [current, setCurrent] = useState<Theme>(() =>
        typeof document === 'undefined'
            ? theme
            : document.documentElement.classList.contains('dark')
              ? 'dark'
              : 'light'
    );
    const dark = current === 'dark';

    function toggle() {
        const next: Theme = dark ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        setPreferenceCookie(THEME_COOKIE, next);
        setCurrent(next);
    }

    return (
        <button
            type="button"
            role="switch"
            aria-checked={dark}
            onClick={toggle}
            aria-label={t('nav.theme')}
            className="border-line bg-surface2 hover:border-blaze relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors"
        >
            <span
                className={`bg-blaze text-on-accent flex h-5 w-5 items-center justify-center rounded-full transition-transform ${
                    dark ? 'translate-x-[22px]' : 'translate-x-[2px]'
                }`}
            >
                {dark ? (
                    <Sun
                        size={12}
                        aria-hidden
                    />
                ) : (
                    <Moon
                        size={12}
                        aria-hidden
                    />
                )}
            </span>
        </button>
    );
}
