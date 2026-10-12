import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { routineWorkbook, xlsxResponse } from '@/lib/export';
import { isMember, routineHistory } from '@/lib/queries';
import type { NextRequest } from 'next/server';

/** The routine as an .xlsx with what has been trained in it so far: for
    whoever may read its history, the same people the history page lets in. */
export async function GET(
    _req: NextRequest,
    ctx: RouteContext<'/progress/[id]/export'>
) {
    const { id } = await ctx.params;
    const user = await currentUser();
    if (!user) return new Response(null, { status: 401 });

    const [history, t] = await Promise.all([routineHistory(id), getT()]);
    if (!history) return new Response(null, { status: 404 });
    const { routine, byDay, startedOn } = history;
    if (routine.creatorId !== user.id && !(await isMember(id, user.id)))
        return new Response(null, { status: 404 });

    const workouts = routine.workouts.map((workout) => ({
        ...workout,
        weeks: Object.fromEntries(
            Object.entries(startedOn[workout.id] ?? {}).map(
                ([week, startedAt]) => [
                    week,
                    { startedAt, logs: byDay[workout.id]?.[+week] ?? {} },
                ]
            )
        ),
    }));

    return xlsxResponse(
        await routineWorkbook({ ...routine, workouts }, t),
        `${routine.name} - ${t('progress.title')}`
    );
}
