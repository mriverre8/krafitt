import {
    Copy,
    RoutineListSkeleton,
    Skeleton,
    TabsSkeleton,
} from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <Copy
                k="nav.routines"
                className="display text-6xl"
            />
            <TabsSkeleton />
            <RoutineListSkeleton />
        </Skeleton>
    );
}
