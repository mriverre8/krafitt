"use client";

import { useT } from "@/i18n/useT";
import type { FormAction } from "@/lib/forms";
import { Trash, X } from "lucide-react";
import { ActionButton } from "./ActionButton";
import { AddExerciseForm } from "./AddExerciseForm";
import type { ExerciseView } from "./WorkoutExercise";

export function WorkoutEditor({
  workout,
  addExercise,
  onDeleteWorkout,
  onDeleteExercise,
}: {
  workout: { id: string; name: string; exercises: ExerciseView[] };
  addExercise: FormAction;
  onDeleteWorkout: (workoutId: string) => Promise<void>;
  onDeleteExercise: (exerciseId: string) => Promise<void>;
}) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="display text-xl">{workout.name}</h3>
        <ActionButton
          action={() => onDeleteWorkout(workout.id)}
          confirm={t("routine.deleteDayConfirm", { name: workout.name })}
          label={t("routine.deleteDay")}
          className="text-muted transition hover:text-blaze"
        >
          <Trash size={16} aria-hidden />
        </ActionButton>
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
            <ActionButton
              action={() => onDeleteExercise(exercise.id)}
              label={t("exercise.delete")}
              className="shrink-0 text-muted transition hover:text-blaze"
            >
              <X size={14} aria-hidden />
            </ActionButton>
          </li>
        ))}
        {workout.exercises.length === 0 && (
          <li className="text-muted">{t("routine.noExercises")}</li>
        )}
      </ul>

      <div className="mt-3">
        <AddExerciseForm action={addExercise} workoutId={workout.id} />
      </div>
    </div>
  );
}
