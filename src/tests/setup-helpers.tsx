import { ModalHost } from '@/components/modal-host';
import { I18nProvider } from '@/i18n/i18n-provider';
import { dictionaries, type Locale } from '@/i18n/config';
import { fireEvent, render, screen, within } from '@testing-library/react';

/** Renders inside a locale provider. Without it components fall back to English. */
export function renderWithLocale(
    ui: React.ReactElement,
    locale: Locale = 'en'
) {
    return render(
        <I18nProvider
            locale={locale}
            dict={dictionaries[locale]}
        >
            {ui}
        </I18nProvider>
    );
}

/** The app mounts one ModalHost in the layout, and every modal opens through
    it. A test that opens one has to stand in for the layout. */
export const withModals = (ui: React.ReactNode) => (
    <>
        {ui}
        <ModalHost />
    </>
);

/** Already on screen, or not there at all — never use it to wait for one. */
export const confirmDialog = () => screen.queryByRole('dialog');

/** Awaited, because the host loads the modal as its own chunk. */
export const openConfirm = () => screen.findByRole('dialog');

export async function acceptConfirm(name: string | RegExp) {
    const dialog = await openConfirm();
    fireEvent.click(within(dialog).getByRole('button', { name }));
}

export async function declineConfirm() {
    const dialog = await openConfirm();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
}

/** A no-op form action, for forms whose submission is not under test. */
export const noopAction = async () => ({});
