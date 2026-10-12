import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { routineWorkbook } from '@/lib/export';
import { isMember, routineDetail } from '@/lib/queries';
import { isRoutineComplete } from '@/lib/validate';
import type { NextRequest } from 'next/server';

/** The routine as an .xlsx, for whoever may read it: the same people the
    routine page lets in. */
export async function GET(
    _req: NextRequest,
    ctx: RouteContext<'/routines/[id]/export'>
) {
    const { id } = await ctx.params;
    const user = await currentUser();
    if (!user) return new Response(null, { status: 401 });

    const [routine, t] = await Promise.all([routineDetail(id), getT()]);
    if (!routine) return new Response(null, { status: 404 });
    const owner = routine.creatorId === user.id;
    if (!owner && !routine.isPublic && !(await isMember(id, user.id)))
        return new Response(null, { status: 404 });

    // The menu hides the option on an incomplete routine; this is what holds.
    if (!isRoutineComplete(routine, t))
        return new Response(t('error.routineIncomplete'), { status: 409 });

    return new Response(await routineWorkbook(routine, t), {
        headers: {
            'Content-Type':
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(routine.name)}.xlsx`,
        },
    });
}
