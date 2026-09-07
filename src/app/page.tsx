import { EmptyState } from "@/components/empty-state";
import { Landing } from "@/components/landing";
import { TodayWorkout } from "@/components/today-workout";
import { getT } from "@/i18n/server";
import { currentUser } from "@/lib/auth";
import { todayWorkout } from "@/lib/queries";

export default async function HomePage() {
  const user = await currentUser();
  if (!user) return <Landing />;

  const [today, t] = await Promise.all([todayWorkout(user.id), getT()]);

  if (!today) {
    return <EmptyState title={t("home.noRoutineTitle")} body={t("home.noRoutineBody")} />;
  }

  if (today.finished) {
    return (
      <EmptyState
        title={t("home.finishedTitle", { name: today.routine.name })}
        body={t("home.finishedBody")}
      />
    );
  }

  return (
    <TodayWorkout
      routineId={today.routine.id}
      routineName={today.routine.name}
      week={today.week}
      totalWeeks={today.routine.durationWeeks}
      workout={today.workout}
      sessionId={today.sessionId}
      logs={today.logs}
      previous={today.previous}
      previousWeek={today.previousWeek}
    />
  );
}
