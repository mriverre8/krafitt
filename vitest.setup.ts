import '@testing-library/jest-dom/vitest';
import { useModalStore } from '@/store/modal';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

// The modal store outlives the render that opened one, so a test that leaves a
// modal up would hand it to the next one.
afterEach(() => useModalStore.setState({ open: null }));

// jsdom lays nothing out, so it ships no scrollIntoView. Components that keep
// a selection on screen call it for real in a browser.
Element.prototype.scrollIntoView = () => {};

// jsdom 30 ships the <dialog> element without its behaviour, so a modal never
// opens under test. Enough of it to drive the real component — the top layer,
// the backdrop and the focus trap are the browser's job, not ours to fake.
const dialog = HTMLDialogElement.prototype;
dialog.showModal ??= function () {
    this.setAttribute('open', '');
};
dialog.close ??= function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
};
