import type { TKey } from '@/i18n/config';

/**
 * What one row of a history counts. A routine is read week by week; a workout
 * has no weeks, only the times it was done — the same rows underneath, so the
 * history draws both and only the words change.
 */
export type Period = 'week' | 'run';

export const PERIOD_WORDS = {
    week: {
        short: 'progress.week',
        label: 'progress.weekLabel',
        caption: 'progress.tableCaption',
        adherence: 'progress.stats.adherenceDetail',
        stalledCount: 'progress.stats.stalledCountDetail',
        records: 'progress.stats.recordsDetail',
        sinceFirst: 'progress.stats.sinceFirst',
        volumeChange: 'progress.stats.volumeChange',
        stalled: 'progress.stats.stalled',
    },
    run: {
        short: 'progress.run',
        label: 'progress.runLabel',
        caption: 'progress.runTableCaption',
        adherence: 'progress.stats.runAdherenceDetail',
        stalledCount: 'progress.stats.runStalledCountDetail',
        records: 'progress.stats.runRecordsDetail',
        sinceFirst: 'progress.stats.runSinceFirst',
        volumeChange: 'progress.stats.runVolumeChange',
        stalled: 'progress.stats.runStalled',
    },
} as const satisfies Record<Period, Record<string, TKey>>;
