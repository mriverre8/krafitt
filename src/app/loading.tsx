import { Bar, Skeleton } from '@/components/skeleton';
import { cardClass } from '@/lib/ui';

/** The shape of TodayWorkout: the lit header plate, then the exercises. */
export default function Loading() {
    return (
        <Skeleton>
            <div
                className={`${cardClass} border-l-volt space-y-5 border-l-[6px] p-5`}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                        <Bar className="h-3 w-32" />
                        <Bar className="h-14 w-3/4" />
                    </div>
                    <Bar className="h-16 w-16 shrink-0" />
                </div>
                <div className="space-y-2">
                    <Bar className="h-2 w-full" />
                    <Bar className="h-4 w-28" />
                </div>
            </div>

            {[0, 1, 2].map((index) => (
                <div
                    key={index}
                    className={`${cardClass} space-y-3`}
                >
                    <Bar className="h-6 w-1/2" />
                    <Bar className="h-3 w-1/4" />
                    <Bar className="h-11 w-full" />
                    <Bar className="h-11 w-full" />
                </div>
            ))}
        </Skeleton>
    );
}
