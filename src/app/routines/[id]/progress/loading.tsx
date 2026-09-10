import { Bar, Skeleton } from '@/components/ui/skeleton';
import { cardClass } from '@/lib/ui';

/** One day and, inside it, one exercise — the shape the page settles into. */
export default function Loading() {
    return (
        <Skeleton>
            <div className="space-y-2">
                <Bar className="h-5 w-20" />
                <Bar className="mt-5 h-3 w-40" />
                <Bar className="h-14 w-2/3" />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <Bar className="h-3 w-24" />
                    <div className="flex shrink-0 gap-1">
                        <Bar className="h-9 w-9 rounded-md" />
                        <Bar className="h-9 w-9 rounded-md" />
                    </div>
                </div>
                <div className="flex gap-2">
                    {[0, 1, 2].map((index) => (
                        <Bar
                            key={index}
                            className="h-12 w-12 shrink-0 rounded-md"
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-baseline justify-between gap-4">
                    <Bar className="h-9 w-1/2" />
                    <Bar className="h-4 w-24 shrink-0" />
                </div>
                <Bar className="h-3 w-56" />

                <div className={`${cardClass} space-y-3`}>
                    <div className="flex items-center justify-between gap-2">
                        <Bar className="h-7 w-1/2" />
                        <Bar className="h-9 w-24 shrink-0 rounded-md" />
                    </div>
                    <Bar className="h-10 w-full" />
                    {[0, 1, 2].map((index) => (
                        <Bar
                            key={index}
                            className="h-8 w-full"
                        />
                    ))}
                </div>
            </div>
        </Skeleton>
    );
}
