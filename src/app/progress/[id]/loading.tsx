import {
    BackBar,
    Bar,
    Copy,
    DaySwitcherSkeleton,
    Line,
    Skeleton,
} from '@/components/ui/skeleton';
import { cardClass, eyebrowLine } from '@/lib/ui';

export default function Loading() {
    return (
        <Skeleton>
            <div>
                <BackBar />
                <div className="mt-5">
                    <Bar className={`w-40 ${eyebrowLine}`} />
                    <Copy
                        k="progress.title"
                        className="display mt-1 text-6xl"
                    />
                </div>
            </div>

            <div className="space-y-8">
                <DaySwitcherSkeleton />

                <div className="space-y-4">
                    <div className="flex h-8.75 justify-between gap-4">
                        <Bar className="h-[32.4px] w-1/2" />
                        <Bar className="h-5 w-24 shrink-0 self-end" />
                    </div>
                    <Line
                        className="h-6"
                        bar="w-56"
                    />
                    <div className={cardClass}>
                        <div className="flex h-11 items-center justify-between gap-2 md:h-8.5">
                            <Bar className="h-6.75 w-1/2" />
                            <Bar className="h-5 w-24 shrink-0" />
                        </div>
                        <div className="mt-3 space-y-2">
                            <Bar className="h-9 w-full" />
                            {[0, 1, 2].map((set) => (
                                <Bar
                                    key={set}
                                    className="h-[50.5px] w-full"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Skeleton>
    );
}
