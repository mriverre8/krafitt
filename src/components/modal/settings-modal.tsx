'use client';

import { useT } from '@/i18n/use-t';
import type { Theme } from '@/lib/theme';
import { labelClass } from '@/lib/ui';
import { Modal } from '@/components/modal/modal';
import { LocaleSwitcher } from '@/components/chrome/locale-switcher';
import { ThemeToggle } from '@/components/chrome/theme-toggle';

export type SettingsModalProps = {
    theme: Theme;
    /** Supplied by the ModalHost. */
    onClose: () => void;
};

/**
 * Language and theme, out of the menu and into a dialog of their own. Nothing
 * here is confirmed or discarded — both switches take effect as they are
 * flipped — so there is no button row at all, only the shell's close.
 */
export function SettingsModal({ theme, onClose }: SettingsModalProps) {
    const t = useT();

    return (
        <Modal
            title={t('nav.settings')}
            onClose={onClose}
        >
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3">
                    <span className={labelClass}>{t('nav.language')}</span>
                    <LocaleSwitcher />
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span className={labelClass}>{t('nav.theme')}</span>
                    <ThemeToggle theme={theme} />
                </div>
            </div>
        </Modal>
    );
}
