import { Bar, Skeleton } from '@/components/ui/skeleton';
import { cardClass } from '@/lib/ui';

export default function Loading() {
    return (
        <Skeleton>
            <div className="space-y-2">
                <Bar className="h-5 w-20" />
                <Bar className="mt-5 h-14 w-2/3" />
                <div className="flex items-center justify-between gap-3 pt-2">
                    <Bar className="h-3 w-40" />
                    <Bar className="h-6 w-16 shrink-0" />
                </div>
            </div>

            <Bar className="h-7 w-28" />

            <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                    <div
                        key={index}
                        className={`${cardClass} space-y-3`}
                    >
                        <Bar className="h-7 w-1/2" />
                        <Bar className="h-3 w-1/3" />
                    </div>
                ))}
            </div>
        </Skeleton>
    );
}
