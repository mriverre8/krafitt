import { Bar, FollowRowsSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <div className="space-y-2">
                <Bar className="h-5 w-20" />
                <Bar className="mt-5 h-3 w-40" />
                <Bar className="h-14 w-2/3" />
                <Bar className="mt-2 h-4 w-56" />
            </div>

            <div className="flex gap-2">
                <Bar className="h-11 flex-1 rounded-md" />
                <Bar className="h-11 w-11 shrink-0 rounded-md" />
            </div>

            <FollowRowsSkeleton />
        </Skeleton>
    );
}
