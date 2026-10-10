import { Bar, Skeleton } from '@/components/ui/skeleton';
import { cardClass, badgeLine, eyebrowLine } from '@/lib/ui';

/** `TodayWorkout`: the day's header card, then a card per exercise. */
export default function Loading() {
    return (
        <Skeleton>
            <div className="space-y-4">
                <div className="border-line border-l-volt bg-surface space-y-5 rounded-md border border-l-[6px] p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <Bar className={`w-32 ${eyebrowLine}`} />
                            <Bar className="mt-2 h-13.5 w-3/4" />
                        </div>
                        <Bar className="h-[73.2px] w-[42px] shrink-0 rounded-md md:h-[75.6px]" />
                    </div>
                    <div className="space-y-2">
                        <Bar className="h-2 w-full" />
                        <div className="flex items-start justify-between gap-4">
                            <Bar className="h-5 w-20" />
                            <Bar className={`w-24 ${badgeLine}`} />
                        </div>
                    </div>
                </div>

                {[0, 1, 2].map((exercise) => (
                    <div
                        key={exercise}
                        className={cardClass}
                    >
                        <Bar className="h-6.75 w-1/2" />
                        <div className="mt-4 space-y-2.5">
                            {[0, 1, 2].map((set) => (
                                <div
                                    key={set}
                                    className="space-y-1.5"
                                >
                                    <Bar className="h-4 w-28 md:h-5" />
                                    <Bar className="h-12 w-full rounded-md" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Skeleton>
    );
}
