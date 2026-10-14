'use client';

import { useLocale, useT } from '@/i18n/use-t';
import { EFFORT_FILL, EFFORT_ICON, EFFORT_WORD } from '@/lib/effort';
import { PERIOD_WORDS, type Period } from '@/lib/period';
import { EFFORTS } from '@/lib/progress';
import { STALL_WEEKS, type RoutineStats } from '@/lib/stats';
import { cardClass, labelClass } from '@/lib/ui';

/** The routine at a glance, above the day it is reading: how much of it was
    turned up for, how much was lifted, and how it felt. */
export function RoutineSummary({
    stats,
    week,
    weeks,
    period = 'week',
}: {
    stats: RoutineStats;
    /** The week being trained — or, counting runs, how many times it was done. */
    week: number;
    /** How many there are; null for an open-ended routine. */
    weeks: number | null;
    period?: Period;
}) {
    const t = useT();
    const words = PERIOD_WORDS[period];
    const locale = useLocale();
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    const percent = new Intl.NumberFormat(locale, { style: 'percent' });

    const sets = EFFORTS.reduce((sum, e) => sum + stats.efforts[e], 0);

    const tiles = [
        {
            label: t('progress.stats.adherence'),
            value: stats.setsDue
                ? percent.format(stats.setsDone / stats.setsDue)
                : '—',
            detail: t(words.adherence, {
                sets: stats.setsDone,
                total: stats.setsDue,
                done: stats.done,
                due: stats.due,
            }),
        },
        period === 'run'
            ? {
                  label: t('progress.stats.runs'),
                  value: String(week),
                  detail: t('progress.stats.runsDetail'),
              }
            : {
                  label: t('progress.stats.week'),
                  value: weeks ? `${week}/${weeks}` : String(week),
                  detail: weeks
                      ? t('progress.stats.weekOf', { n: week, total: weeks })
                      : t('progress.weekLabel', { n: week }),
              },
        {
            label: t('progress.stats.volume'),
            value: `${number.format(stats.volume)} kg`,
            detail: t('progress.stats.volumeDetail'),
        },
        {
            label: t('progress.stats.session'),
            value: stats.minutes === null ? '—' : `${stats.minutes} min`,
            detail: t('progress.stats.sessionDetail'),
        },
        {
            label: t('progress.stats.records'),
            value: number.format(stats.records),
            detail: t(words.records),
        },
        {
            label: t('progress.stats.stalledCount'),
            value: number.format(stats.stalled),
            detail: t(words.stalledCount, {
                n: STALL_WEEKS,
            }),
        },
    ];

    return (
        <section
            aria-labelledby="routine-summary"
            className="space-y-3"
        >
            <h2
                id="routine-summary"
                className={labelClass}
            >
                {t('progress.stats.title')}
            </h2>

            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {tiles.map((tile) => (
                    <div
                        key={tile.label}
                        className={cardClass}
                    >
                        <dt className={labelClass}>{tile.label}</dt>
                        <dd className="figure text-ink mt-1 text-3xl leading-none">
                            {tile.value}
                        </dd>
                        <dd className="text-muted mt-1.5 text-xs">
                            {tile.detail}
                        </dd>
                    </div>
                ))}
            </dl>

            {sets > 0 && (
                <div className={`${cardClass} space-y-2.5`}>
                    <h3 className={labelClass}>{t('progress.stats.effort')}</h3>
                    <div
                        aria-hidden
                        className="flex h-3 gap-0.5 overflow-hidden rounded-sm"
                    >
                        {EFFORTS.map(
                            (effort) =>
                                stats.efforts[effort] > 0 && (
                                    <span
                                        key={effort}
                                        className={EFFORT_FILL[effort]}
                                        style={{
                                            flexGrow: stats.efforts[effort],
                                        }}
                                    />
                                )
                        )}
                    </div>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        {EFFORTS.map((effort) => {
                            const Icon = EFFORT_ICON[effort];
                            return (
                                <li
                                    key={effort}
                                    className="text-muted flex items-center gap-1.5"
                                >
                                    <span
                                        aria-hidden
                                        className={`grid size-4 place-items-center rounded-sm ${EFFORT_FILL[effort]}`}
                                    >
                                        <Icon
                                            size={10}
                                            strokeWidth={3}
                                        />
                                    </span>
                                    {t(EFFORT_WORD[effort])}
                                    <span className="figure text-ink">
                                        {percent.format(
                                            stats.efforts[effort] / sets
                                        )}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </section>
    );
}
