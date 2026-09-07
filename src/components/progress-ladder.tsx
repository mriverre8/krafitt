'use client';

/**
 * One segment per workout in the routine, in order: the week × day sequence the
 * cursor walks. Done segments are filled, the next one is outlined.
 * ponytail: falls back to a single bar past 24 segments, where the segments stop
 * being readable. Group by week if long routines ever need more detail.
 */
export function ProgressLadder({
    done,
    total,
    label,
}: {
    done: number;
    total: number;
    label: string;
}) {
    const filled = Math.max(0, Math.min(done, total));

    if (total > 24) {
        return (
            <div
                role="img"
                aria-label={label}
                className="bg-surface2 h-1.5 w-full overflow-hidden rounded-full"
            >
                <div
                    className="bg-blaze h-full rounded-full"
                    style={{
                        width: `${total > 0 ? (filled / total) * 100 : 0}%`,
                    }}
                />
            </div>
        );
    }

    return (
        <div
            role="img"
            aria-label={label}
            className="flex gap-1"
        >
            {Array.from({ length: total }, (_, index) => (
                <span
                    key={index}
                    className={`h-1.5 flex-1 rounded-full ${
                        index < filled
                            ? 'bg-blaze'
                            : index === filled
                              ? 'bg-blaze/30 ring-blaze ring-1'
                              : 'bg-surface2'
                    }`}
                />
            ))}
        </div>
    );
}
