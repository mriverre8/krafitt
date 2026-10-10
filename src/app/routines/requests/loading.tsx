import { Bar, FollowRowsSkeleton, Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <div className="space-y-2">
                <Bar className="h-5 w-20" />
                <Bar className="mt-5 h-14 w-64" />
            </div>

            <FollowRowsSkeleton />
        </Skeleton>
    );
}
