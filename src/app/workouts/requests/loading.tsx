import {
    BackBar,
    Copy,
    RequestRowsSkeleton,
    Skeleton,
} from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <Skeleton>
            <div>
                <BackBar />
                <Copy
                    k="requests.title"
                    className="display text-6xl"
                />
            </div>
            <RequestRowsSkeleton />
        </Skeleton>
    );
}
