'use client';

import { useT } from '@/i18n/use-t';
import {
    useId,
    useState,
    type ComponentProps,
    type KeyboardEvent,
} from 'react';

/** The most suggestions the list holds at once: past that, typing narrows it. */
const SHOWN = 20;

/**
 * An exercise's name, which is also how a card picks back an exercise the day
 * archived: the list under the field offers those whose name holds what has
 * been typed, and picking one fills the name in — the server matches exercises
 * by name, so that is all bringing one back takes.
 *
 * A combobox of its own rather than a `<datalist>`: the browser draws that one
 * however it likes, at whatever width, and lets nobody style it.
 */
export function ExerciseNameField({
    value,
    onChange,
    suggestions,
    ...input
}: {
    value: string;
    onChange: (name: string) => void;
    /** Archived exercises of the day not on any card, by name. */
    suggestions: readonly string[];
} & Omit<ComponentProps<'input'>, 'value' | 'onChange'>) {
    const t = useT();
    const listId = useId();
    const [open, setOpen] = useState(false);
    /** The option the arrow keys are on, or -1 for none. */
    const [active, setActive] = useState(-1);

    const query = value.trim().toLowerCase();
    const shown = suggestions
        .filter((name) => name.toLowerCase().includes(query))
        .slice(0, SHOWN);
    const expanded = open && shown.length > 0;

    function show() {
        setOpen(true);
        setActive(-1);
    }

    function pick(name: string) {
        onChange(name);
        setOpen(false);
        setActive(-1);
    }

    function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (shown.length === 0) return;
            const down = event.key === 'ArrowDown';
            setOpen(true);
            setActive((index) =>
                index < 0
                    ? down
                        ? 0
                        : shown.length - 1
                    : (index + (down ? 1 : -1) + shown.length) % shown.length
            );
        } else if (event.key === 'Enter' && expanded && active >= 0) {
            event.preventDefault();
            pick(shown[active]);
        } else if (event.key === 'Escape') {
            // Closes the list, and never wipes the name the way a search box
            // would on its own.
            event.preventDefault();
            setOpen(false);
        }
    }

    return (
        <>
            <input
                {...input}
                type="search"
                role="combobox"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={expanded}
                aria-controls={expanded ? listId : undefined}
                aria-activedescendant={
                    expanded && active >= 0 ? `${listId}-${active}` : undefined
                }
                value={value}
                onChange={(event) => {
                    onChange(event.target.value);
                    show();
                }}
                onFocus={show}
                onClick={show}
                onBlur={() => setOpen(false)}
                onKeyDown={onKeyDown}
            />

            {expanded && (
                <ul
                    id={listId}
                    role="listbox"
                    aria-label={t('exercise.suggestions')}
                    className="border-line bg-surface absolute top-full right-0 left-0 z-15 mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto rounded-md border-2 p-2 shadow-2xl"
                >
                    {shown.map((name, index) => (
                        <li
                            key={name}
                            id={`${listId}-${index}`}
                            role="option"
                            aria-selected={index === active}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => pick(name)}
                            className='display text-muted hover:bg-surface2 hover:text-pulse aria-selected:bg-surface2 aria-selected:text-pulse cursor-pointer rounded-md px-2 py-2.5 text-xl transition-colors'
                        >
                            {name}
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}
