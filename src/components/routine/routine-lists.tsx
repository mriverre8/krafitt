import { RoutineCard } from '@/components/routine/routine-card';
import { RoutineSharedCard } from '@/components/routine/routine-shared-card';
import { Avatar } from '@/components/ui/avatar';
import { getT } from '@/i18n/server';
import { isRoutineFinished } from '@/lib/progress';
import { OWNER_PREVIEW_SIZE } from '@/lib/pagination';
import type { routinesOf, sharingOwners } from '@/lib/queries';
import { cardClass, ghostClass } from '@/lib/ui';
import { isRoutineComplete } from '@/lib/validate';
import Link from 'next/link';

type Routine = Awaited<ReturnType<typeof routinesOf>>[number];
type Owner = Awaited<ReturnType<typeof sharingOwners>>[number];
type Shared = Owner['routines'][number];

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

/** Routines somebody else let the user into, all of them the same owner's. */
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
                    />
                </li>
            ))}
        </ul>
    );
}

/** The shared routines grouped by whose they are: each owner previews a few,
    and hands the rest over to a page of their own. */
export async function SharedOwnerBlocks({ owners }: { owners: Owner[] }) {
    const t = await getT();

    if (owners.length === 0)
        return (
            // Drawn like an empty routine: same card, same title over body.
            <div className={`${cardClass} mt-10`}>
                <h2 className="display text-3xl">
                    {t('routines.sharedEmptyTitle')}
                </h2>
                <p className="text-muted mt-2 text-sm md:text-base">
                    {t('routines.sharedEmptyBody')}
                </p>
            </div>
        );

    return (
        <div className="space-y-8">
            {owners.map((owner) => (
                <section
                    key={owner.id}
                    className="space-y-3"
                >
                    <header className="flex items-center justify-between gap-3">
                        <h2 className="flex min-w-0 items-center gap-2.5">
                            <Avatar
                                name={owner.name}
                                src={owner.image}
                                className="size-8 text-xs"
                            />
                            <span className="display truncate text-2xl">
                                {owner.name}
                            </span>
                        </h2>
                        {owner._count.routines > OWNER_PREVIEW_SIZE && (
                            <Link
                                href={`/routines/shared/${owner.id}`}
                                className={`${ghostClass} shrink-0 py-1.5!`}
                            >
                                {t('routines.viewMore')}
                            </Link>
                        )}
                    </header>
                    <SharedRoutineList routines={owner.routines} />
                </section>
            ))}
        </div>
    );
}
