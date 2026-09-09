import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

// jsdom lays nothing out, so it ships no scrollIntoView. Components that keep
// a selection on screen call it for real in a browser.
Element.prototype.scrollIntoView = () => {};
