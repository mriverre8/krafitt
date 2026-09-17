'use client';

import { useT } from '@/i18n/use-t';
import { isSetEnabled } from '@/lib/progress';
import { ProgressLadder } from '@/components/ui/progress-ladder';
import { WorkoutExercise } from '@/components/workout/workout-exercise';
import {
    BENCH,
    LAST_TIME,
    LOGGED,
    todayExercise,
    WEEK,
    WEEKS,
} from '@/lib/landing';

export function TodayPreview() {
    const t = useT();

    const exercise = todayExercise(t);
    const done = Object.keys(LOGGED).length;
    const total = exercise.sets.length;
    const progress = t('today.progress', { done, total });
    const store = { [BENCH]: LOGGED };

    return (
        <div className="space-y-4">
            <header className="border-line border-l-volt bg-surface space-y-5 rounded-md border border-l-[6px] p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="eyebrow text-muted truncate">
                            {t('landing.demoRoutine')}
                        </p>
                        <p className="display text-ink mt-2 text-5xl sm:text-6xl">
                            {t('landing.day1')}
                        </p>
                    </div>
                    <p className="bg-volt text-on-volt figure grid shrink-0 place-items-center rounded-md px-3 py-2 leading-none">
                        <span className="sr-only">
                            {t('today.week', { week: WEEK, total: WEEKS })}
                        </span>
                        <span
                            aria-hidden
                            className="text-4xl"
                        >
                            {WEEK}
                        </span>
                        <span
                            aria-hidden
                            className="eyebrow mt-1 opacity-70"
                        >
                            / {WEEKS}
                        </span>
                    </p>
                </div>

                <div className="space-y-2">
                    <ProgressLadder
                        done={done}
                        total={total}
                        label={progress}
                    />
                    <p className="figure text-muted text-sm">{progress}</p>
                </div>
            </header>

            <div inert>
                <WorkoutExercise
                    exercise={exercise}
                    logs={LOGGED}
                    previous={LAST_TIME}
                    isSetEnabled={(setIndex) =>
                        isSetEnabled([exercise], store, BENCH, setIndex)
                    }
                    onSaveSet={() => {}}
                />
            </div>
        </div>
    );
}
