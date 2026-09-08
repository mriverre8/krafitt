/**
 * The app's one piece of branding: half the name set in a slanted volt slab.
 * Sized by the caller through font-size, so the slab scales with the text.
 * The inner span cancels the skew — the block leans, the letters stay upright.
 */
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
