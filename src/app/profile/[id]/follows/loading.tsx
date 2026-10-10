import {
    BackBar,
    Bar,
    FollowRowsSkeleton,
    Skeleton,
    TabsSkeleton,
} from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <div>
                <BackBar />
                <Bar className="h-[43.2px] w-2/3" />
            </div>
            <TabsSkeleton />
            <FollowRowsSkeleton />
        </Skeleton>
    );
}
