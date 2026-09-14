import { Bar } from '@/components/skeleton/bar';
import { accentClass, cardClass } from '@/lib/ui';

/** A routine as both lists draw it: name, meta, badge, ladder, count. */
export function RoutineCardSkeleton({ accent = false }: { accent?: boolean }) {
    return (
        <div className={`${cardClass} ${accent ? accentClass : ''}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                    <Bar className="h-7 w-2/3" />
                    <Bar className="h-3 w-1/3" />
                </div>
                <Bar className="h-7 w-24 shrink-0" />
            </div>
            <div className="mt-5 space-y-2">
                <Bar className="h-2 w-full" />
                <Bar className="h-4 w-28" />
            </div>
        </div>
    );
}
