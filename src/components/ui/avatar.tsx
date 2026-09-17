import Image from 'next/image';

export function Avatar({
    name,
    src,
    className = '',
}: {
    name: string;
    src?: string | null;
    className?: string;
}) {
    const shared = `shrink-0 overflow-hidden rounded-md ${className}`;

    if (src)
        return (
            <Image
                src={src}
                alt=""
                aria-hidden
                width={96}
                height={96}
                unoptimized={src.startsWith('data:')}
                className={`${shared} object-cover`}
            />
        );

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
