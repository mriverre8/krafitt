import { BackBar, Bar, Line, Skeleton } from '@/components/ui/skeleton';
import { cardClass, badgeLine, eyebrowLine } from '@/lib/ui';

/** The routine page's skeleton without its days: a workout has one, and the
    editor draws it with no title of its own. */
export default function Loading() {
    return (
        <Skeleton>
            <div>
                <BackBar />
                <Bar className="mt-5 h-13.5 w-2/3" />
                <div className="mt-2 flex items-center justify-between gap-3">
                    <Bar className={`w-40 ${eyebrowLine}`} />
                    <Bar className="h-5.5 w-16 shrink-0 md:h-[23.6px]" />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <Bar className={`w-28 ${badgeLine}`} />
                <Bar className={`w-24 ${badgeLine}`} />
            </div>

            <div className="space-y-4">
                {[0, 1].map((exercise) => (
                    <div
                        key={exercise}
                        className={cardClass}
                    >
                        <Bar className="h-[21.6px] w-1/2" />
                        <div className="mt-4">
                            {[0, 1, 2].map((set) => (
                                <div
                                    key={set}
                                    className={`flex justify-between gap-3 ${
                                        set
                                            ? 'border-line mt-3 border-t pt-3 pb-1'
                                            : 'pb-1'
                                    }`}
                                >
                                    <Line
                                        className="h-6"
                                        bar="w-20"
                                    />
                                    <Line
                                        className="h-6"
                                        bar="w-16"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </Skeleton>
    );
}
