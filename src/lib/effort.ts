import { Equal, Minus, Plus, X } from 'lucide-react';

/** What an answer looks like and is called, wherever one is shown: the picker
    that asks the question and the mark the banked set keeps. Colour is not here
    — each of the two says it its own way, one as a fill and one as type. */
export const EFFORT_ICON = {
    fail: X,
    hard: Minus,
    normal: Equal,
    easy: Plus,
} as const;

/** Said in full, for a label or a screen reader. */
export const EFFORT_SAID = {
    fail: 'today.effortFail',
    hard: 'today.effortHard',
    normal: 'today.effortNormal',
    easy: 'today.effortEasy',
} as const;

/** The one word that fits in a column. */
export const EFFORT_WORD = {
    fail: 'today.effortFailShort',
    hard: 'today.effortHardShort',
    normal: 'today.effortNormalShort',
    easy: 'today.effortEasyShort',
} as const;
