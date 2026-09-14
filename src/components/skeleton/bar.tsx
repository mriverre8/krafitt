/**
 * One placeholder bar. Its size is the caller's business: a skeleton exists to
 * hold exactly the space the real thing will take, so nothing jumps when the
 * content lands. `line` rather than `surface2` because a bar has to read both on
 * the page background and inside a card, and only one of the two greys does.
 */
export function Bar({ className = '' }: { className?: string }) {
    return <div className={`bg-line animate-pulse rounded-xs ${className}`} />;
}
