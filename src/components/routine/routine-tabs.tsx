import { getT } from '@/i18n/server';
import { Inbox } from 'lucide-react';
import Link from 'next/link';

const tabs = [
    { href: '/routines', label: 'routines.title' },
    { href: '/routines/shared', label: 'routines.sharedTitle' },
] as const;

const tabClass = (selected: boolean) =>
    `font-display -mb-0.5 border-b-2 pb-2 text-sm font-bold tracking-wide uppercase transition-colors ${
        selected
            ? 'border-volt text-ink'
            : 'text-muted hover:text-pulse border-transparent'
    }`;

/** `requests` is how many are waiting on the user: the tab to answer them
    only shows while there is something to answer. */
export async function RoutineTabs({
    current,
    requests = 0,
}: {
    current: string;
    requests?: number;
}) {
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
                        className={tabClass(selected)}
                    >
                        {t(label)}
                    </Link>
                );
            })}
            {requests > 0 && (
                <Link
                    href="/routines/requests"
                    aria-label={t('requests.tab', { count: requests })}
                    className={`${tabClass(false)} ml-auto flex items-center gap-1.5`}
                >
                    <Inbox
                        size={16}
                        strokeWidth={2.5}
                        aria-hidden
                    />
                    <span className="hidden sm:inline">
                        {t('requests.title')}
                    </span>
                    <span className="bg-volt text-on-volt grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.625rem] leading-none">
                        {requests}
                    </span>
                </Link>
            )}
        </nav>
    );
}
