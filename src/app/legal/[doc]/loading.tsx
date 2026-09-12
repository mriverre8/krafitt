import { Bar, Skeleton } from '@/components/ui/skeleton';

/** A title and prose: a couple of sections of a policy, held to the same 68ch
    measure the text lands at. */
export default function Loading() {
    return (
        <Skeleton>
            <div>
                <Bar className="h-11 w-32 rounded-md" />
                <Bar className="mt-5 h-11 w-3/4" />
            </div>

            <div className="max-w-[68ch] space-y-8">
                {[0, 1].map((section) => (
                    <div
                        key={section}
                        className="space-y-3"
                    >
                        <Bar className="h-7 w-1/2" />
                        <Bar className="h-3.5 w-full" />
                        <Bar className="h-3.5 w-full" />
                        <Bar className="h-3.5 w-5/6" />
                    </div>
                ))}
            </div>
        </Skeleton>
    );
}
