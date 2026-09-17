'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass, cardClass } from '@/lib/ui';
import { editorSpecs } from '@/lib/landing';

export function EditorSpecs() {
    const t = useT();
    const specs = editorSpecs(t);

    return (
        <ul className="grid gap-3 sm:grid-cols-2">
            {specs.map(({ stat, Icon, title, body, chips }) => (
                <li
                    key={title}
                    className={`${cardClass} space-y-2`}
                >
                    {stat !== undefined ? (
                        <span
                            aria-hidden
                            className="figure bg-volt text-on-volt inline-grid h-11 min-w-11 place-items-center rounded-md px-2 text-2xl leading-none"
                        >
                            {stat}
                        </span>
                    ) : (
                        Icon && (
                            <span
                                aria-hidden
                                className="bg-surface2 text-pulse grid h-11 w-11 place-items-center rounded-md"
                            >
                                <Icon size={20} />
                            </span>
                        )
                    )}
                    <h3 className="display text-2xl">{title}</h3>
                    <p className="text-muted text-sm text-pretty">{body}</p>
                    {chips && (
                        <ul className="flex flex-wrap gap-1.5 pt-1">
                            {chips.map((chip) => (
                                <li
                                    key={chip}
                                    className={`${badgeClass} border-line text-muted border-2`}
                                >
                                    {chip}
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            ))}
        </ul>
    );
}
