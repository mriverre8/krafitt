import {
    BackBar,
    Bar,
    Copy,
    DaySwitcherSkeleton,
    Line,
    Skeleton,
} from '@/components/ui/skeleton';
import { badgeLine, cardClass, eyebrowLine } from '@/lib/ui';

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
                <Bar className={`mt-4 w-36 ${badgeLine}`} />
            </div>

            <div className="space-y-3">
                <Bar className={`w-24 ${eyebrowLine}`} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[0, 1, 2, 3, 4, 5].map((tile) => (
                        <div
                            key={tile}
                            className={cardClass}
                        >
                            <Bar className={`w-20 ${eyebrowLine}`} />
                            <Bar className="mt-1 h-7.5 w-16" />
                            <div className="mt-1.5 h-8 space-y-1">
                                <Bar className="h-3 w-full" />
                                <Bar className="h-3 w-2/3" />
                            </div>
                        </div>
                    ))}
                </div>
                <div className={`${cardClass} space-y-2.5`}>
                    <Bar className={`w-40 ${eyebrowLine}`} />
                    <Bar className="h-3 w-full rounded-sm" />
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {[0, 1, 2, 3].map((effort) => (
                            <Bar
                                key={effort}
                                className="h-4 w-16"
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <DaySwitcherSkeleton />

                <div className="space-y-4">
                    <div className="h-8.75">
                        <Bar className="h-[32.4px] w-1/2" />
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

                    {/* `ExerciseStats`: best set and estimated max side by
                        side, then the two weeks of volume. */}
                    <div className={`${cardClass} space-y-4`}>
                        <div className="grid grid-cols-2 gap-4">
                            {[0, 1].map((figure) => (
                                <div key={figure}>
                                    <Bar className={`w-24 ${eyebrowLine}`} />
                                    <Bar className="mt-1 h-6 w-20" />
                                    <Line
                                        className="mt-1 h-4"
                                        bar="w-16"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="flex h-5 items-center justify-between gap-2">
                                <Bar className={`w-48 ${eyebrowLine}`} />
                                <Bar className="h-3.5 w-24" />
                            </div>
                            {[0, 1].map((week) => (
                                <div
                                    key={week}
                                    className="flex h-5 items-center gap-3"
                                >
                                    <Bar className="h-3 w-14" />
                                    <Bar className="h-2.5 flex-1" />
                                    <Bar className="h-3.5 w-14" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Skeleton>
    );
}
