import { Bar } from '@/components/skeleton/bar';
import { RoutineCardSkeleton } from '@/components/skeleton/routine-card-skeleton';
import { Skeleton } from '@/components/skeleton/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <Bar className="h-14 w-64" />

            <div className="space-y-3">
                <RoutineCardSkeleton accent />
                <RoutineCardSkeleton />
                <RoutineCardSkeleton />
            </div>
        </Skeleton>
    );
}
