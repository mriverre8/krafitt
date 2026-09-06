import {
  addAthlete,
  addExercise,
  addWorkout,
  deleteExercise,
  deleteRoutine,
  deleteWorkout,
  removeMember,
  setMemberEdit,
} from "@/app/actions";
import { ActionButton } from "@/components/ActionButton";
import { AddAthleteForm } from "@/components/AddAthleteForm";
import { AddWorkoutForm } from "@/components/AddWorkoutForm";
import { AthleteList } from "@/components/AthleteList";
import { WorkoutEditor } from "@/components/WorkoutEditor";
import { getT } from "@/i18n/server";
import { requireAccess } from "@/lib/access";
import { currentUser } from "@/lib/auth";
import { routineDetail } from "@/lib/queries";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function RoutinePage({ params }: PageProps<"/routines/[id]">) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/");

  const { isCreator, canEdit } = await requireAccess(id, user.id);
  const [routine, t] = await Promise.all([routineDetail(id), getT()]);
  if (!routine) notFound();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="display text-4xl">{routine.name}</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-muted">
          {t("routine.meta", {
            weeks: routine.durationWeeks,
            days: routine.workouts.length,
          })}
        </p>
        <Link
          href={`/routines/${routine.id}/stats`}
          className="text-xs font-bold uppercase tracking-widest text-blaze hover:underline"
        >
          {t("routine.stats")}
        </Link>
      </header>

      <section className="space-y-4">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted">
          {t("routine.workouts")}
        </h2>

        {routine.workouts.map((workout) => (
          <WorkoutEditor
            key={workout.id}
            workout={workout}
            canEdit={canEdit}
            addExercise={addExercise}
            onDeleteWorkout={deleteWorkout}
            onDeleteExercise={deleteExercise}
          />
        ))}

        {canEdit && <AddWorkoutForm action={addWorkout} routineId={routine.id} />}
        {!canEdit && routine.workouts.length === 0 && (
          <p className="text-sm text-muted">{t("routine.noWorkouts")}</p>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted">
          {t("athletes.title")}
        </h2>

        <AthleteList
          athletes={routine.members.map((member) => ({
            userId: member.userId,
            name: member.user.name,
            email: member.user.email,
            canEdit: member.canEdit,
            isOwner: member.userId === routine.creatorId,
          }))}
          viewerIsOwner={isCreator}
          onToggleEdit={setMemberEdit.bind(null, routine.id)}
          onRemove={removeMember.bind(null, routine.id)}
        />

        {isCreator ? (
          <AddAthleteForm action={addAthlete} routineId={routine.id} />
        ) : (
          <p className="text-xs text-muted">{t("athletes.onlyOwner")}</p>
        )}
      </section>

      {isCreator && (
        <ActionButton
          action={deleteRoutine.bind(null, routine.id)}
          confirm={t("routine.deleteConfirm", { name: routine.name })}
          className="text-[11px] font-bold uppercase tracking-widest text-blaze"
        >
          {t("routine.delete")}
        </ActionButton>
      )}
    </div>
  );
}
