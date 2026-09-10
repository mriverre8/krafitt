import { Bar, RoutineCardSkeleton, Skeleton } from '@/components/skeleton';
import { cardClass } from '@/lib/ui';

export default function Loading() {
    return (
        <Skeleton>
            <div className={`${cardClass} flex items-center gap-4`}>
                <Bar className="size-16 shrink-0 rounded-full! md:size-20" />
                <div className="min-w-0 flex-1 space-y-2">
                    <Bar className="h-9 w-2/3 md:h-11" />
                    <Bar className="h-3 w-40" />
                    <Bar className="h-4 w-48" />
                </div>
            </div>

            <div className="space-y-3">
                <Bar className="h-3 w-32" />
                <RoutineCardSkeleton accent />
            </div>

            <div className="space-y-3">
                <Bar className="h-3 w-32" />
                <RoutineCardSkeleton />
            </div>
        </Skeleton>
    );
}
