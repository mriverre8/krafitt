import { Bar, RoutineCardSkeleton, Skeleton } from '@/components/ui/skeleton';
import { cardClass, eyebrowLine } from '@/lib/ui';

export default function Loading() {
    return (
        <Skeleton>
            <div className="space-y-4">
                <div className={`${cardClass} flex items-center gap-4`}>
                    <Bar className="size-16 shrink-0 rounded-md! md:size-20" />
                    <div className="min-w-0 flex-1">
                        <Bar className="h-[32.4px] w-2/3 md:h-[43.2px]" />
                        <Bar className={`mt-1.5 w-40 ${eyebrowLine}`} />
                        <Bar className="mt-2 h-5 w-48" />
                    </div>
                </div>

                <Bar className="h-9 w-full rounded-md! md:h-11" />
            </div>

            {/* `TrainingYear`: the grid keeps the real one's proportions and
                its 620px floor, so it is as tall as the year it stands for. */}
            <div className="space-y-3">
                <Bar className={`w-40 ${eyebrowLine}`} />
                <div className={`${cardClass} space-y-1`}>
                    <div className="overflow-x-auto pb-1">
                        <div className="min-w-155 space-y-1">
                            <div className="h-2.5" />
                            <Bar className="aspect-[7.73] w-full" />
                        </div>
                    </div>
                    <Bar className="h-5 w-32" />
                </div>
            </div>

            <div className="space-y-3">
                <Bar className={`w-32 ${eyebrowLine}`} />
                <RoutineCardSkeleton accent />
            </div>

            <div className="space-y-3">
                <Bar className={`w-32 ${eyebrowLine}`} />
                <RoutineCardSkeleton />
            </div>
        </Skeleton>
    );
}
