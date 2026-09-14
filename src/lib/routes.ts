/**
 * Every path the app links to, redirects at or revalidates, in one place.
 *
 * These strings are the one thing a route rename cannot be checked against:
 * `href`, `redirect()` and `revalidatePath()` all take a plain string, so a
 * moved folder leaves a dead link that nothing but a click will find. Written
 * once here, a rename is one edit.
 */

import type { Doc } from './legal';

export const HOME = '/';
export const ROUTINES = '/routines';
export const PROFILE = '/profile';

export const routinePath = (id: string) => `${ROUTINES}/${id}`;
export const routineProgressPath = (id: string) =>
    `${routinePath(id)}/progress`;
export const legalPath = (doc: Doc) => `/legal/${doc}`;
