import { getT } from "@/i18n/server";
import { prisma } from "./db";

export type AccessLevel = "view" | "edit" | "owner";

/**
 * The single place permissions are checked: every server action goes through it.
 * view  -> is a member of the routine
 * edit  -> canEdit, or is the owner
 * owner -> owner only (sharing, permissions, deleting)
 */
export async function requireAccess(routineId: string, userId: string, level: AccessLevel = "view") {
  const t = await getT();
  const routine = await prisma.routine.findUnique({ where: { id: routineId } });
  if (!routine) throw new Error(t("error.routineNotFound"));

  const membership = await prisma.routineMember.findUnique({
    where: { routineId_userId: { routineId, userId } },
  });
  const isCreator = routine.creatorId === userId;

  if (!membership && !isCreator) throw new Error(t("error.noAccess"));
  if (level === "owner" && !isCreator) throw new Error(t("error.onlyOwner"));
  if (level === "edit" && !isCreator && !membership?.canEdit) {
    throw new Error(t("error.noEditPermission"));
  }

  return { routine, membership, isCreator, canEdit: isCreator || !!membership?.canEdit };
}

export async function routineIdOfWorkout(workoutId: string) {
  const workout = await prisma.workout.findUnique({
    where: { id: workoutId },
    select: { routineId: true },
  });
  if (!workout) throw new Error((await getT())("error.workoutNotFound"));
  return workout.routineId;
}

export async function routineIdOfExercise(exerciseId: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { workout: { select: { routineId: true } } },
  });
  if (!exercise) throw new Error((await getT())("error.exerciseNotFound"));
  return exercise.workout.routineId;
}
