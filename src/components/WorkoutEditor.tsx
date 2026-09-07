"use client";

import { useT } from "@/i18n/useT";
import type { FormAction } from "@/lib/forms";
import { cardClass, iconButtonClass } from "@/lib/ui";
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
    <div className={cardClass}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="display text-2xl">{workout.name}</h3>
        <ActionButton
          action={() => onDeleteWorkout(workout.id)}
          confirm={t("routine.deleteDayConfirm", { name: workout.name })}
          label={t("routine.deleteDay")}
          className={iconButtonClass}
        >
          <Trash size={16} aria-hidden />
        </ActionButton>
      </div>

      <ul className="mt-2 text-sm">
        {workout.exercises.map((exercise) => (
          <li
            key={exercise.id}
            className="flex items-center justify-between gap-2 border-t border-line py-2 transition-colors hover:bg-surface2"
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
              className={`${iconButtonClass} shrink-0`}
            >
              <X size={14} aria-hidden />
            </ActionButton>
          </li>
        ))}
        {workout.exercises.length === 0 && (
          <li className="pt-2 text-muted">{t("routine.noExercises")}</li>
        )}
      </ul>

      <div className="mt-3">
        <AddExerciseForm action={addExercise} workoutId={workout.id} />
      </div>
    </div>
  );
}
