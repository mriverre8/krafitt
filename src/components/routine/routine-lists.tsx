import { RoutineCard } from '@/components/routine/routine-card';
import { RoutineSharedCard } from '@/components/routine/routine-shared-card';
import { getT } from '@/i18n/server';
import { isRoutineFinished } from '@/lib/progress';
import type { routinesOf, sharedRoutinesOf } from '@/lib/queries';
import { isRoutineComplete } from '@/lib/validate';

type Routine = Awaited<ReturnType<typeof routinesOf>>[number];
type Shared = Awaited<ReturnType<typeof sharedRoutinesOf>>[number];

/** The user's own routines, drawn the same whether it is the five the index
    previews or a page of the full list. */
export async function RoutineList({ routines }: { routines: Routine[] }) {
    const t = await getT();

    return (
        <ul className="space-y-3">
            {routines.map((routine) => (
                <li key={routine.id}>
                    <RoutineCard
                        id={routine.id}
                        name={routine.name}
                        durationWeeks={routine.durationWeeks}
                        workoutCount={routine._count.workouts}
                        cursor={routine.cursor}
                        isActive={routine.isActive}
                        finished={isRoutineFinished(
                            routine.cursor,
                            routine._count.workouts,
                            routine.durationWeeks
                        )}
                        canActivate={isRoutineComplete(routine, t)}
                    />
                </li>
            ))}
            {routines.length === 0 && (
                <li className="border-line text-muted rounded-md border-2 border-dashed p-6 text-center">
                    {t('routines.empty')}
                </li>
            )}
        </ul>
    );
}

/** The routines somebody else let the user into. */
export function SharedRoutineList({ routines }: { routines: Shared[] }) {
    return (
        <ul className="space-y-3">
            {routines.map((routine) => (
                <li key={routine.id}>
                    <RoutineSharedCard
                        id={routine.id}
                        name={routine.name}
                        durationWeeks={routine.durationWeeks}
                        workoutCount={routine._count.workouts}
                        cursor={routine.cursor}
                        ownerName={routine.creator.name}
                        ownerImage={routine.creator.image}
                        role={routine.role}
                    />
                </li>
            ))}
        </ul>
    );
}
