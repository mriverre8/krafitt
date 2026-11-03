'use client';

import { useT } from '@/i18n/use-t';
import { formatSeconds } from '@/lib/reps';
import { BoxNote } from '@/components/workout/box-note';

/** A box of seconds read back as minutes once it reaches one: `90` reads
    `1:30 min` under the number. Under a minute, or blank, it says nothing. */
export function MinutesHint({ seconds }: { seconds: string }) {
    const t = useT();
    const value = Number(seconds);
    if (value < 60) return null;
    return <BoxNote>{formatSeconds(value, t)}</BoxNote>;
}
