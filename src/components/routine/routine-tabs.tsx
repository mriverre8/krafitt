import { getT } from '@/i18n/server';
import Link from 'next/link';

const tabs = [
    { href: '/routines', label: 'routines.title' },
    { href: '/routines/shared', label: 'routines.sharedTitle' },
] as const;

export async function RoutineTabs({ current }: { current: string }) {
    const t = await getT();

    return (
        <nav className="border-line flex gap-6 border-b-2">
            {tabs.map(({ href, label }) => {
                const selected = href === current;
                return (
                    <Link
                        key={href}
                        href={href}
                        aria-current={selected ? 'page' : undefined}
                        className={`font-display -mb-0.5 border-b-2 pb-2 text-sm font-bold tracking-wide uppercase transition-colors ${
                            selected
                                ? 'border-volt text-ink'
                                : 'text-muted hover:text-pulse border-transparent'
                        }`}
                    >
                        {t(label)}
                    </Link>
                );
            })}
        </nav>
    );
}
