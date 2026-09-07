import { createRoutine, setActiveRoutine } from "@/app/actions";
import { CreateRoutineForm } from "@/components/CreateRoutineForm";
import { RoutineCard } from "@/components/RoutineCard";
import { getT } from "@/i18n/server";
import { currentUser } from "@/lib/auth";
import { myRoutines } from "@/lib/queries";
import { redirect } from "next/navigation";

export default async function RoutinesPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const [routines, t] = await Promise.all([myRoutines(user.id), getT()]);

  return (
    <div className="space-y-6">
      <h1 className="display text-4xl">{t("routines.title")}</h1>

      <ul className="space-y-2">
        {routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            id={routine.id}
            name={routine.name}
            durationWeeks={routine.durationWeeks}
            workoutCount={routine._count.workouts}
            cursor={routine.cursor}
            isActive={routine.isActive}
            onSetActive={setActiveRoutine}
          />
        ))}
        {routines.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
            {t("routines.empty")}
          </li>
        )}
      </ul>

      <CreateRoutineForm action={createRoutine} />
    </div>
  );
}
