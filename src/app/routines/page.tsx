import { createRoutine } from '@/app/actions';
import { CreateRoutineForm } from '@/components/routine/create-routine-form';
import { RoutineList } from '@/components/routine/routine-lists';
import { RoutineTabs } from '@/components/routine/routine-tabs';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { PREVIEW_SIZE } from '@/lib/pagination';
import { countRequests, countRoutines, routinesOf } from '@/lib/queries';
import { ghostClass } from '@/lib/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function RoutinesPage() {
    const user = await currentUser();
    if (!user) redirect('/');

    const [total, routines, requests, t] = await Promise.all([
        countRoutines(user.id),
        routinesOf(user.id, { skip: 0, take: PREVIEW_SIZE }),
        countRequests(user.id),
        getT(),
    ]);

    return (
        <div className="space-y-6">
            <h1 className="display text-6xl">{t('nav.routines')}</h1>
            <RoutineTabs
                current="/routines"
                requests={requests}
            />

            <RoutineList routines={routines} />
            {total > PREVIEW_SIZE && (
                <Link
                    href="/routines/all"
                    className={`${ghostClass} block text-center`}
                >
                    {t('routines.viewMore')}
                </Link>
            )}

            <CreateRoutineForm action={createRoutine} />
        </div>
    );
}
