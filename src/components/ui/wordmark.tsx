export function Wordmark({ className = '' }: { className?: string }) {
    return (
        <span className={`display inline-flex items-center ${className}`}>
            Kra
            <span className="bg-volt text-on-volt ml-[0.06em] -skew-x-12 px-[0.14em] py-[0.02em]">
                <span className="inline-block skew-x-12">fitt</span>
            </span>
        </span>
    );
}
