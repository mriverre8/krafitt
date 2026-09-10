/**
 * The account's face rendered as initials, a monogram.
 */
export function Avatar({
    name,
    className = '',
}: {
    name: string;
    className?: string;
}) {
    // Decorative: the name it stands for is always right beside it.
    const shared = `shrink-0 overflow-hidden rounded-md ${className}`;

    const initials =
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((word) => [...word][0] ?? '')
            .join('')
            .toUpperCase() || '?';

    return (
        <span
            aria-hidden
            className={`${shared} bg-volt text-on-volt display grid place-items-center leading-none`}
        >
            {initials}
        </span>
    );
}
