import {
    BackBar,
    Copy,
    WorkoutListSkeleton,
    SearchSkeleton,
    Skeleton,
} from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <div>
                <BackBar />
                <Copy
                    k="workouts.title"
                    className="display text-5xl sm:text-6xl"
                />
            </div>
            <SearchSkeleton filter />
            <WorkoutListSkeleton />
        </Skeleton>
    );
}
