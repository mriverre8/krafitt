"use client";

import { useT } from "@/i18n/useT";
import type { FormAction } from "@/lib/forms";
import { ActionButton } from "./ActionButton";
import { AddExerciseForm } from "./AddExerciseForm";
import type { ExerciseView } from "./WorkoutExercise";

export function WorkoutEditor({
  workout,
  canEdit,
  addExercise,
  onDeleteWorkout,
  onDeleteExercise,
}: {
  workout: { id: string; name: string; exercises: ExerciseView[] };
  canEdit: boolean;
  addExercise: FormAction;
  onDeleteWorkout: (workoutId: string) => Promise<void>;
  onDeleteExercise: (exerciseId: string) => Promise<void>;
}) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="display text-xl">{workout.name}</h3>
        {canEdit && (
          <ActionButton
            action={() => onDeleteWorkout(workout.id)}
            confirm={t("routine.deleteDayConfirm", { name: workout.name })}
          >
            {t("routine.deleteDay")}
          </ActionButton>
        )}
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        {workout.exercises.map((exercise) => (
          <li
            key={exercise.id}
            className="flex items-center justify-between gap-2 border-t border-line pt-1.5"
          >
            <span className="min-w-0">
              <span className="font-semibold">{exercise.name}</span>
              <span className="text-muted">
                {" · "}
                {exercise.sets}×{exercise.repMin}-{exercise.repMax} · {exercise.technique}
                {exercise.targetWeight !== null &&
                  ` · ${t("today.target", { weight: exercise.targetWeight })}`}
              </span>
            </span>
            {canEdit && (
              <ActionButton action={() => onDeleteExercise(exercise.id)}>
                {t("exercise.delete")}
              </ActionButton>
            )}
          </li>
        ))}
        {workout.exercises.length === 0 && (
          <li className="text-muted">{t("routine.noExercises")}</li>
        )}
      </ul>

      {canEdit && (
        <div className="mt-3">
          <AddExerciseForm action={addExercise} workoutId={workout.id} />
        </div>
      )}
    </div>
  );
}
