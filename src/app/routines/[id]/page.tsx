import {
  addExercise,
  addWorkout,
  deleteExercise,
  deleteRoutine,
  deleteWorkout,
} from "@/app/actions";
import { ActionButton } from "@/components/action-button";
import { AddWorkoutForm } from "@/components/add-workout-form";
import { WorkoutEditor } from "@/components/workout-editor";
import { getT } from "@/i18n/server";
import { requireRoutine } from "@/lib/access";
import { currentUser } from "@/lib/auth";
import { routineDetail } from "@/lib/queries";
import { Trash } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export default async function RoutinePage({ params }: PageProps<"/routines/[id]">) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/");

  await requireRoutine(id, user.id);
  const [routine, t] = await Promise.all([routineDetail(id), getT()]);
  if (!routine) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-5xl">{routine.name}</h1>
        <p className="text-muted">
          {t("routine.meta", {
            weeks: routine.durationWeeks,
            days: routine.workouts.length,
          })}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted">{t("routine.workouts")}</h2>

        {routine.workouts.map((workout) => (
          <WorkoutEditor
            key={workout.id}
            workout={workout}
            addExercise={addExercise}
            onDeleteWorkout={deleteWorkout}
            onDeleteExercise={deleteExercise}
          />
        ))}

        <AddWorkoutForm action={addWorkout} routineId={routine.id} />
      </section>

      <ActionButton
        action={deleteRoutine.bind(null, routine.id)}
        confirm={t("routine.deleteConfirm", { name: routine.name })}
        className="flex items-center gap-1.5 text-sm font-semibold text-danger transition-colors hover:text-danger/80"
      >
        <Trash size={14} aria-hidden />
        {t("routine.delete")}
      </ActionButton>
    </div>
  );
}
