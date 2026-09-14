/**
 * Every modal in the app, in one place.
 *
 * They arrive as their own chunks: a modal is by definition something most
 * visits never open, and none of them belong in the bundle that has to be
 * parsed before the first workout is on screen. dynamic() has to sit at the top
 * level of a module with a literal path — the bundler matches the chunk to the
 * call — so this registry is written out by hand rather than built in a loop.
 *
 * To add one: write the component as children of <Modal>, add a line here and a
 * key to ModalProps in the store. Nothing else in the app changes.
 */

import dynamic from 'next/dynamic';

export const modals = {
    confirm: dynamic(() =>
        import('@/components/modal/confirm-modal').then((m) => m.ConfirmModal)
    ),
    settings: dynamic(() =>
        import('@/components/modal/settings-modal').then((m) => m.SettingsModal)
    ),
};
