import {
    BackBar,
    Copy,
    SearchSkeleton,
    SharedOwnersSkeleton,
    Skeleton,
} from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <div>
                <BackBar />
                <Copy
                    k="routines.sharedTitle"
                    className="display text-6xl"
                />
            </div>
            <SearchSkeleton filter />
            <SharedOwnersSkeleton />
        </Skeleton>
    );
}
