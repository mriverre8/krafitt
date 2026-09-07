"use client";

import { logSet, skipDay, startWorkout } from "@/app/actions";
import { useT } from "@/i18n/useT";
import { isSetEnabled, type Logs } from "@/lib/progress";
import { ghostClass, primaryClass } from "@/lib/ui";
import { useSessionStore } from "@/store/session";
import { Flame, Play, SkipForward } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { FormError } from "./FormError";
import { WorkoutExercise, type ExerciseView } from "./WorkoutExercise";

export type TodayWorkoutProps = {
  routineId: string;
  routineName: string;
  week: number;
  totalWeeks: number;
  workout: { id: string; name: string; exercises: ExerciseView[] };
  sessionId: string | null;
  logs: Logs;
  previous: Logs;
  previousWeek: number | null;
};

export function TodayWorkout(props: TodayWorkoutProps) {
  const { routineId, routineName, week, totalWeeks, workout, previous, previousWeek } = props;
  const t = useT();
  const { sessionId, logs, hydrate } = useSessionStore();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    hydrate(props.sessionId, props.logs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.sessionId, workout.id]);

  const started = sessionId !== null;

  function run(operation: () => Promise<unknown>) {
    startTransition(async () => {
      setError(undefined);
      try {
        await operation();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : t("today.genericError"));
      }
    });
  }

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted">{routineName}</p>
            <h1 className="display text-5xl text-ink">{workout.name}</h1>
          </div>
          {/* "2 / 8" reads at arm's length; the sentence stays for screen readers. */}
          <p className="figure shrink-0 text-right text-3xl leading-none text-blaze">
            <span className="sr-only">{t("today.week", { week, total: totalWeeks })}</span>
            <span aria-hidden>
              {week}
              <span className="block text-xs font-medium text-muted">/ {totalWeeks}</span>
            </span>
          </p>
        </div>

        <div className="mt-4">
          {started ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-surge">
              <Flame size={16} aria-hidden />
              {t("today.inProgress")}
            </p>
          ) : (
            <button
              type="button"
              disabled={pending || workout.exercises.length === 0}
              onClick={() => run(() => startWorkout(workout.id, week))}
              className={`${primaryClass} flex w-full items-center justify-center gap-2 py-4 text-lg`}
            >
              <Play size={18} aria-hidden />
              {t("today.start")}
            </button>
          )}
        </div>
      </header>

      <FormError message={error} />

      {workout.exercises.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          {t("today.noExercises")}
        </p>
      )}


      {workout.exercises.map((exercise) => (
        <WorkoutExercise
          key={exercise.id}
          exercise={exercise}
          logs={logs[exercise.id] ?? {}}
          previous={previous[exercise.id] ?? {}}
          previousWeek={previousWeek}
          isSetEnabled={(setIndex) =>
            started && isSetEnabled(workout.exercises, logs, exercise.id, setIndex)
          }
          onSaveSet={(setIndex, weight, reps) =>
            run(async () => {
              await logSet(sessionId!, exercise.id, setIndex, weight, reps);
              useSessionStore.getState().save(exercise.id, setIndex, { weight, reps });
            })
          }
        />
      ))}

      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => skipDay(routineId))}
        className={`${ghostClass} flex w-full items-center justify-center gap-2`}
      >
        <SkipForward size={14} aria-hidden />
        {t("today.skip")}
      </button>
    </div>
  );
}
