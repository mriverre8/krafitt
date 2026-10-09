import { RoutineCard } from '@/components/routine/routine-card';
import { RoutineSharedCard } from '@/components/routine/routine-shared-card';
import { Avatar } from '@/components/ui/avatar';
import type { Translate } from '@/i18n/config';
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

const noResultsClass =
    'border-line text-muted rounded-md border-2 border-dashed p-6 text-center';

/** What picks the badge on a card of one of the user's own routines — and so
    what the status filter on the full list has to match against too. */
export function ownRoutineState(routine: Routine, t: Translate) {
    return {
        isActive: routine.isActive,
        finished: isRoutineFinished(
            routine.cursor,
            routine._count.workouts,
            routine.durationWeeks
        ),
        canActivate: isRoutineComplete(routine, t),
    };
}

/** The user's own routines, drawn the same whether it is the five the index
    previews or a page of the full list. `searching` says an empty list is a
    search that missed, not a user with nothing yet. */
export async function RoutineList({
    routines,
    searching = false,
}: {
    routines: Routine[];
    searching?: boolean;
}) {
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
                        {...ownRoutineState(routine, t)}
                    />
                </li>
            ))}
            {routines.length === 0 && (
                <li className={noResultsClass}>
                    {t(searching ? 'routines.noResults' : 'routines.empty')}
                </li>
            )}
        </ul>
    );
}

/** Routines somebody else let the user into, all of them the same owner's. */
export async function SharedRoutineList({
    routines,
    searching = false,
}: {
    routines: Shared[];
    searching?: boolean;
}) {
    const t = await getT();

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
            {searching && routines.length === 0 && (
                <li className={noResultsClass}>{t('routines.noResults')}</li>
            )}
        </ul>
    );
}

/** The shared routines grouped by whose they are: each owner previews a few,
    and hands the rest over to a page of their own. */
export async function SharedOwnerBlocks({
    owners,
    searching = false,
}: {
    owners: Owner[];
    searching?: boolean;
}) {
    const t = await getT();

    if (owners.length === 0 && searching)
        return <p className={noResultsClass}>{t('routines.noResults')}</p>;

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
