import {
    BackBar,
    Copy,
    RoutineListSkeleton,
    SearchSkeleton,
    Skeleton,
} from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <div>
                <BackBar />
                <Copy
                    k="routines.title"
                    className="display text-6xl"
                />
            </div>
            <SearchSkeleton filter />
            <RoutineListSkeleton />
        </Skeleton>
    );
}
