/**
 * What the signed-out home page claims the editor can hold, read straight off
 * `lib/constants.ts` so a card can never outlive the rule it is quoting.
 */

import type { Translate } from '@/i18n/config';
import { ChevronsDown, Repeat, Tag } from 'lucide-react';
import { EXERCISES, SETS, WEEKS } from './constants';
import type { Spec } from './types';

export const CHIPS = [
    'landing.chip1',
    'landing.chip2',
    'landing.chip3',
] as const;

export function editorSpecs(t: Translate): readonly Spec[] {
    return [
        {
            stat: WEEKS.max,
            title: t('landing.spec1Title', { n: WEEKS.max }),
            body: t('landing.spec1Body'),
        },
        {
            stat: EXERCISES.max,
            title: t('landing.spec2Title', { n: EXERCISES.max }),
            body: t('landing.spec2Body'),
        },
        {
            stat: SETS.max,
            title: t('landing.spec3Title', { n: SETS.max }),
            body: t('landing.spec3Body'),
        },
        {
            Icon: Repeat,
            title: t('landing.spec4Title'),
            body: t('landing.spec4Body'),
            chips: [
                t('today.setPlan', { min: 8, max: 10 }),
                t('today.setPlanFixed', { reps: 10 }),
                t('reps.amrap'),
            ],
        },
        {
            Icon: Tag,
            title: t('landing.spec5Title'),
            body: t('landing.spec5Body'),
            chips: [
                t('technique.warmup'),
                t('technique.topset'),
                t('technique.backoff'),
                t('technique.linear'),
            ],
        },
        {
            Icon: ChevronsDown,
            title: t('landing.spec6Title'),
            body: t('landing.spec6Body'),
            chips: [
                t('set.dropWith', { value: 20 }),
                t('set.restWith', { value: 15 }),
            ],
        },
    ];
}
