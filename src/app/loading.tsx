import { Bar, Skeleton } from '@/components/ui/skeleton';
import { cardClass, badgeLine, eyebrowLine, stickyBarClass } from '@/lib/ui';

/** `TodayWorkout`: the day's header card, a card per exercise as it is read
    before training, and the bar its button sits in. */
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
                        <Bar className="h-[73.2px] w-10.5 shrink-0 rounded-md md:h-[75.6px]" />
                    </div>
                    <Bar className={`w-24 ${badgeLine}`} />
                </div>

                {[0, 1, 2].map((exercise) => (
                    <div
                        key={exercise}
                        className={cardClass}
                    >
                        <Bar className="h-6.75 w-1/2" />
                        <div className="mt-4">
                            {[0, 1, 2].map((set) => (
                                <div
                                    key={set}
                                    className={`flex items-center justify-between gap-3 pb-1 ${
                                        set > 0
                                            ? 'border-line mt-3 border-t pt-3'
                                            : ''
                                    }`}
                                >
                                    <Bar className="h-4 w-20 md:h-5" />
                                    <Bar className="h-4 w-14 md:h-5" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className={stickyBarClass}>
                    <Bar className="h-13 w-full rounded-md" />
                </div>
            </div>
        </Skeleton>
    );
}
