import { Copy, WorkoutListSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <Copy
                k="nav.workouts"
                className="display text-5xl sm:text-6xl"
            />
            <WorkoutListSkeleton />
        </Skeleton>
    );
}
