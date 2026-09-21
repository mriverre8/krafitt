import { createRoutine } from '@/app/actions';
import { CreateRoutineForm } from '@/components/routine/create-routine-form';
import {
    RoutineList,
    SharedRoutineList,
} from '@/components/routine/routine-lists';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { PREVIEW_SIZE } from '@/lib/pagination';
import {
    countRoutines,
    countSharedRoutines,
    routinesOf,
    sharedRoutinesOf,
} from '@/lib/queries';
import { ghostClass } from '@/lib/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function RoutinesPage() {
    const user = await currentUser();
    if (!user) redirect('/');

    const preview = { skip: 0, take: PREVIEW_SIZE };
    const [total, sharedTotal, routines, shared, t] = await Promise.all([
        countRoutines(user.id),
        countSharedRoutines(user.id),
        routinesOf(user.id, preview),
        sharedRoutinesOf(user.id, preview),
        getT(),
    ]);

    const viewMore = (href: string) => (
        <Link
            href={href}
            className={`${ghostClass} block text-center`}
        >
            {t('routines.viewMore')}
        </Link>
    );

    return (
        <div className="space-y-6">
            <h1 className="display text-6xl">{t('routines.title')}</h1>

            <RoutineList routines={routines} />
            {total > PREVIEW_SIZE && viewMore('/routines/all')}

            {shared.length > 0 && (
                <section className="space-y-3">
                    <h2 className="eyebrow text-muted">
                        {t('routines.sharedTitle')}
                    </h2>
                    <SharedRoutineList routines={shared} />
                    {sharedTotal > PREVIEW_SIZE && viewMore('/routines/shared')}
                </section>
            )}

            <CreateRoutineForm action={createRoutine} />
        </div>
    );
}
