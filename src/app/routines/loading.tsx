import { Bar, RoutineCardSkeleton, Skeleton } from '@/components/ui/skeleton';

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
