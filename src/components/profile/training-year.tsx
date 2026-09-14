'use client';

import { useLocale, useT } from '@/i18n/use-t';
import { cardClass, figureClass, labelClass, yearFillClasses } from '@/lib/ui';
import { DAY_MS, dayKey, trainingLevel, utc, weekday } from '@/lib/year';

/**
 * The training year: January to December of the year `end` falls in, one square
 * per day, a column per week with Monday at the top, filled by how much was
 * logged that day. The whole year is drawn, the months still to come included;
 * only the days the first and last columns borrow from the years either side
 * are left out.
 *
 * `end` comes from the server rather than from `new Date()` so the grid renders
 * the same on both sides of hydration.
 *
 * The columns are fractions, not a fixed square size, so the strip fills
 * whatever width it is given. A `min-w` floor keeps the squares legible on a
 * phone, where the year scrolls sideways from January instead.
 */
export function TrainingYear({
    days,
    end,
}: {
    /** ISO date → sets logged that day. */
    days: Record<string, number>;
    /** Today, as ISO. */
    end: string;
}) {
    const t = useT();
    const locale = useLocale();

    const today = new Date(`${end}T00:00:00Z`).getTime();
    const year = new Date(today).getUTCFullYear();

    const january = utc(year, 0, 1);
    const december = utc(year, 11, 31);

    const first = january - weekday(january) * DAY_MS;
    const last = december + (6 - weekday(december)) * DAY_MS;
    const columns = Math.round((last - first) / DAY_MS + 1) / 7;

    const cells = Array.from(
        { length: columns * 7 },
        (_, i) => first + i * DAY_MS
    );

    const monthFormat = new Intl.DateTimeFormat(locale, {
        month: 'short',
        timeZone: 'UTC',
    });
    const dateFormat = new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
    });

    const months = Array.from({ length: 12 }, (_, month) => ({
        name: monthFormat.format(utc(year, month, 1)),
        column: Math.floor((utc(year, month, 1) - first) / DAY_MS / 7),
    }));

    const trained = cells.filter((cell) => days[dayKey(new Date(cell))]).length;
    const summary = t('profile.yearDays', { days: trained });
    const template = `repeat(${columns}, minmax(0, 1fr))`;

    return (
        <section className="space-y-3">
            <h2 className={labelClass}>{t('profile.yearTitle', { year })}</h2>

            <div className={`${cardClass} space-y-1`}>
                <div className="overflow-x-auto pb-1">
                    <div className="min-w-155 space-y-1">
                        <div
                            aria-hidden
                            className="grid gap-0.5"
                            style={{ gridTemplateColumns: template }}
                        >
                            {months.map((month, index) => (
                                <span
                                    key={month.name}
                                    className="text-muted text-[10px] leading-none font-semibold uppercase"
                                    style={{
                                        gridColumn: `${month.column + 1} / ${
                                            (months[index + 1]?.column ??
                                                columns) + 1
                                        }`,
                                    }}
                                >
                                    {month.name}
                                </span>
                            ))}
                        </div>

                        <div
                            role="img"
                            aria-label={`${t('profile.yearTitle', {
                                year,
                            })}: ${summary}`}
                            className="grid grid-flow-col grid-rows-[repeat(7,auto)] gap-0.5"
                            style={{ gridTemplateColumns: template }}
                        >
                            {cells.map((cell) => {
                                const outside =
                                    cell < january || cell > december;
                                const future = cell > today;
                                const sets = days[dayKey(new Date(cell))] ?? 0;
                                const date = dateFormat.format(cell);

                                return (
                                    <span
                                        key={cell}
                                        aria-hidden
                                        title={
                                            outside || future
                                                ? undefined
                                                : sets > 0
                                                  ? t('profile.daySets', {
                                                        sets,
                                                        date,
                                                    })
                                                  : t('profile.dayRest', {
                                                        date,
                                                    })
                                        }
                                        className={`aspect-square rounded-xs ${
                                            outside
                                                ? ''
                                                : yearFillClasses[
                                                      trainingLevel(sets)
                                                  ]
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className={figureClass}>{summary}</p>
                    <p
                        aria-hidden
                        className="text-muted flex items-center gap-1 text-[10px] font-semibold uppercase"
                    >
                        {t('profile.less')}
                        {yearFillClasses.map((fill) => (
                            <span
                                key={fill}
                                className={`size-2.5 rounded-xs ${fill}`}
                            />
                        ))}
                        {t('profile.more')}
                    </p>
                </div>
            </div>
        </section>
    );
}
