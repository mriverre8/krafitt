/**
 * The account's face. A stored photo wins; otherwise the initials, which is a
 * monogram in its own right rather than a placeholder waiting for an upload.
 *
 * The photo goes through a plain <img>, not next/image: the optimizer only
 * accepts absolute URLs whose host is listed in `remotePatterns`, and this app
 * has no image source to list yet — email and password sign-up never fills
 * `image` in. Swap in next/image the day photos come from a host we know.
 */
export function Avatar({
    name,
    image,
    className = '',
}: {
    name: string;
    image?: string | null;
    className?: string;
}) {
    // Decorative either way: the name it stands for is always right beside it.
    const shared = `shrink-0 overflow-hidden rounded-md ${className}`;

    if (image) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={image}
                alt=""
                aria-hidden
                className={`${shared} object-cover`}
            />
        );
    }

    const initials =
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            // Spread, not [0]: an accented or emoji first letter is more than
            // one code unit and would come back as half a character.
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
