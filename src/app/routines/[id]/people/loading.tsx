import {
    BackBar,
    Bar,
    Copy,
    FollowRowsSkeleton,
    Skeleton,
} from '@/components/ui/skeleton';
import { eyebrowLine } from '@/lib/ui';

export default function Loading() {
    return (
        <Skeleton>
            <div>
                <BackBar />
                <div className="mt-5">
                    <Bar className={`w-40 ${eyebrowLine}`} />
                    <Copy
                        k="members.title"
                        className="display mt-1 text-6xl"
                    />
                </div>
                <Copy
                    k="members.subtitle"
                    className="text-muted mt-2 text-sm"
                />
            </div>

            <FollowRowsSkeleton />

            <div>
                <Bar className={`mb-1 w-40 ${eyebrowLine}`} />
                <Bar className="h-12 w-full rounded-md" />
            </div>
        </Skeleton>
    );
}
