import {
    BackBar,
    Bar,
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
                    k="routines.sharedTitle"
                    className="eyebrow text-muted"
                />
                <div className="mt-2 flex items-center gap-3">
                    <Bar className="size-12 shrink-0 rounded-md" />
                    <Bar className="h-13.5 w-1/2" />
                </div>
            </div>
            <SearchSkeleton />
            <RoutineListSkeleton badge={false} />
        </Skeleton>
    );
}
