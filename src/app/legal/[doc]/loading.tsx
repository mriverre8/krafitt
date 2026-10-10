import { BackBar, Bar, Line, Skeleton } from '@/components/ui/skeleton';

// `.markdown` (globals.css): 26.4px lines, 1.1em between blocks, and 2.25rem
// over each 28px section heading.
function Paragraph() {
    return (
        <div className="mt-[17.6px]">
            {['w-full', 'w-full', 'w-5/6'].map((width, line) => (
                <Line
                    key={line}
                    className="h-[26.4px]"
                    bar={width}
                />
            ))}
        </div>
    );
}

export default function Loading() {
    return (
        <Skeleton>
            <div>
                <BackBar />
                <Bar className="mt-5 h-[43.2px] w-3/4 md:h-13.5" />
            </div>

            <div className="max-w-[68ch]">
                <Line
                    className="h-[26.4px]"
                    bar="w-48"
                />
                <Paragraph />
                {[0, 1].map((section) => (
                    <div key={section}>
                        <Bar className="mt-9 h-7 w-1/2" />
                        <Paragraph />
                    </div>
                ))}
            </div>
        </Skeleton>
    );
}
