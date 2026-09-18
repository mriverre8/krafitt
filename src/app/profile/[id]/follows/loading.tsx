import { Bar, Skeleton } from '@/components/ui/skeleton';
import { cardClass } from '@/lib/ui';

export default function Loading() {
    return (
        <Skeleton>
            <div className="space-y-4">
                <Bar className="h-9 w-24" />
                <Bar className="h-12 w-2/3" />
            </div>

            <div className="border-line flex gap-6 border-b-2 pb-2">
                <Bar className="h-4 w-28" />
                <Bar className="h-4 w-24" />
            </div>

            <ul className="space-y-3">
                {[0, 1, 2].map((i) => (
                    <li
                        key={i}
                        className={`${cardClass} flex items-center gap-3`}
                    >
                        <Bar className="size-10 shrink-0 rounded-md!" />
                        <Bar className="h-7 w-40" />
                    </li>
                ))}
            </ul>
        </Skeleton>
    );
}
