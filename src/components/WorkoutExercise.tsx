"use client";

import { useT } from "@/i18n/useT";
import type { SetValue } from "@/lib/progress";
import { SetRow } from "./SetRow";

export type ExerciseView = {
  id: string;
  name: string;
  sets: number;
  repMin: number;
  repMax: number;
  technique: string;
  targetWeight: number | null;
};

export function WorkoutExercise({
  exercise,
  logs,
  previous,
  previousWeek,
  isSetEnabled,
  onSaveSet,
}: {
  exercise: ExerciseView;
  logs: Record<number, SetValue | undefined>;
  previous: Record<number, SetValue | undefined>;
  previousWeek: number | null;
  isSetEnabled: (setIndex: number) => boolean;
  onSaveSet: (setIndex: number, weight: number, reps: number) => void;
}) {
  const t = useT();

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="display text-xl">{exercise.name}</h2>
        <span className="rounded-full bg-surface2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blaze">
          {exercise.technique}
        </span>
      </div>
      <p className="text-xs text-muted">
        {t("today.exerciseMeta", {
          sets: exercise.sets,
          min: exercise.repMin,
          max: exercise.repMax,
        })}
        {exercise.targetWeight !== null &&
          ` · ${t("today.target", { weight: exercise.targetWeight })}`}
      </p>

      <div className="mt-3 space-y-2">
        {Array.from({ length: exercise.sets }, (_, setIndex) => (
          <SetRow
            key={setIndex}
            setIndex={setIndex}
            enabled={isSetEnabled(setIndex)}
            saved={logs[setIndex]}
            previous={previous[setIndex]}
            previousWeek={previousWeek}
            onSave={(weight, reps) => onSaveSet(setIndex, weight, reps)}
          />
        ))}
      </div>
    </section>
  );
}
