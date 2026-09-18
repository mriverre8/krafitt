import { Bar, FollowRowsSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <div className="space-y-4">
                <Bar className="h-9 w-24" />
                <Bar className="h-12 w-2/3" />
            </div>

            <div className="border-line flex gap-6 border-b-2 pb-2">
                <Bar className="h-4 w-28" />
                <Bar className="h-4 w-24" />
            </div>

            <FollowRowsSkeleton />
        </Skeleton>
    );
}
