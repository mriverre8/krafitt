'use client';

import { useLocale, useT } from '@/i18n/use-t';
import type { Logs } from '@/lib/progress';
import { PERIOD_WORDS, type Period } from '@/lib/period';
import { exerciseStats, STALL_WEEKS, type StatsExercise } from '@/lib/stats';
import { badgeClass, cardClass, labelClass } from '@/lib/ui';

/** What the table under it adds up to: the best set, where the estimated max
    has gone since the first week, and the kilos of the last week done in
    full against the one before it. */
export function ExerciseStats({
    exercise,
    weeks,
    period = 'week',
}: {
    exercise: StatsExercise & { name: string };
    /** Every logged week of the day, not only the ones the table draws. */
    weeks: Record<number, Logs>;
    period?: Period;
}) {
    const t = useT();
    const words = PERIOD_WORDS[period];
    const locale = useLocale();
    const stats = exerciseStats(exercise, weeks);
    const stalled = stats.stalled >= STALL_WEEKS;
    if (!stats.best && !stalled) return null;

    const kilos = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const signed = new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 1,
        signDisplay: 'exceptZero',
    });
    const diff = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
        signDisplay: 'exceptZero',
    });
    // The last week done in full against the one before it: a half-done week,
    // on either side, would read as a drop that was never trained.
    const latest = stats.volume.filter((row) => !row.partial).at(-1);
    const delta = latest?.against ? latest.kg - latest.against.kg : 0;
    const tone =
        delta > 0 ? 'text-surge-ink' : delta < 0 ? 'text-danger' : 'text-muted';
    const fill = delta > 0 ? 'bg-surge' : delta < 0 ? 'bg-danger' : 'bg-muted';
    const most = Math.max(latest?.kg ?? 0, latest?.against?.kg ?? 0);

    return (
        <section
            aria-label={t('progress.stats.exercise', { name: exercise.name })}
            className={`${cardClass} space-y-4`}
        >
            {stalled && (
                <p
                    className={`${badgeClass} bg-draft text-on-draft`}
                    title={t('progress.stats.stalledHint')}
                >
                    {t(words.stalled, { n: stats.stalled })}
                </p>
            )}

            {stats.best && (
                <dl className="grid grid-cols-2 gap-4">
                    <div>
                        <dt className={labelClass}>
                            {t('progress.stats.best')}
                        </dt>
                        <dd className="figure text-ink mt-1 text-2xl leading-none">
                            {kilos.format(stats.best.weight)}×{stats.best.reps}
                        </dd>
                        <dd className="text-muted mt-1 text-xs">
                            {t(words.label, { n: stats.best.week })}
                        </dd>
                    </div>
                    <div>
                        <dt className={labelClass}>
                            {t('progress.stats.e1rm')}
                        </dt>
                        <dd className="figure text-ink mt-1 text-2xl leading-none">
                            {kilos.format(stats.best.e1rm)} kg
                        </dd>
                        {stats.change !== null && (
                            <dd
                                className={`mt-1 text-xs font-semibold ${
                                    stats.change > 0
                                        ? 'text-surge-ink'
                                        : stats.change < 0
                                          ? 'text-danger'
                                          : 'text-muted'
                                }`}
                            >
                                {t(words.sinceFirst, {
                                    change: signed.format(stats.change),
                                })}
                            </dd>
                        )}
                    </div>
                </dl>
            )}

            {latest?.against && (
                <figure className="space-y-2">
                    <figcaption className="flex items-baseline justify-between gap-2">
                        <span className={labelClass}>
                            {t(words.volumeChange)}
                        </span>
                        <span className={`figure text-sm ${tone}`}>
                            {`${diff.format(delta)} kg (${signed.format(
                                delta / latest.against.kg
                            )})`}
                        </span>
                    </figcaption>
                    <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5">
                        {[
                            { ...latest.against, fill: 'bg-muted/40' },
                            { ...latest, fill },
                        ].map((row) => (
                            <div
                                key={row.week}
                                className="contents"
                            >
                                <dt className="text-muted text-xs">
                                    {t(words.label, { n: row.week })}
                                </dt>
                                <dd
                                    aria-hidden
                                    className="h-2.5"
                                >
                                    <span
                                        className={`block h-full rounded-r-sm ${row.fill}`}
                                        style={{
                                            width: `${(row.kg / most) * 100}%`,
                                        }}
                                    />
                                </dd>
                                <dd className="figure text-ink text-right text-sm">
                                    {kilos.format(row.kg)} kg
                                </dd>
                            </div>
                        ))}
                    </dl>
                </figure>
            )}
        </section>
    );
}
