'use client';

import { useLocale, useT } from '@/i18n/use-t';
import { cardClass } from '@/lib/ui';
import {
    DAY_MS,
    dayKey,
    fills,
    level,
    utc,
    weekday,
} from '@/lib/training-year';

export function TrainingYear({
    days,
    end,
}: {
    days: Record<string, number>;
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
            <h2 className="eyebrow text-muted">
                {t('profile.yearTitle', { year })}
            </h2>

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
                                            outside ? '' : fills[level(sets)]
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="figure text-muted text-sm">{summary}</p>
                    <p
                        aria-hidden
                        className="text-muted flex items-center gap-1 text-[10px] font-semibold uppercase"
                    >
                        {t('profile.less')}
                        {fills.map((fill) => (
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
