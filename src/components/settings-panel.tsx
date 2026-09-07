'use client';

import { useT } from '@/i18n/use-t';
import type { Theme } from '@/lib/theme';
import { labelClass } from '@/lib/ui';
import { LocaleSwitcher } from './locale-switcher';
import { ThemeToggle } from './theme-toggle';

/** Language and theme, shared by the desktop menu and the mobile one. */
export function SettingsPanel({ theme }: { theme: Theme }) {
    const t = useT();

    return (
        <div className="flex flex-col gap-3 px-2 py-1">
            <div className="flex items-center justify-between gap-3">
                <span className={labelClass}>{t('nav.language')}</span>
                <LocaleSwitcher />
            </div>
            <div className="flex items-center justify-between gap-3">
                <span className={labelClass}>{t('nav.theme')}</span>
                <ThemeToggle theme={theme} />
            </div>
        </div>
    );
}
