'use client';

import { useT } from '@/i18n/use-t';
import {
    searchFrameClass,
    searchInputClass,
    searchSubmitClass,
} from '@/lib/ui';
import { Search } from 'lucide-react';
import Form from 'next/form';
import { useState } from 'react';

type Option = {
    value: string;
    label: string;
    /** How many rows this option would list, when that is cheap to know. */
    count?: number;
    /** What the box asks for while this option is picked. */
    placeholder?: string;
};

type Filter = {
    name: string;
    label: string;
    value?: string;
    options: Option[];
};

export function SearchBar({
    label,
    placeholder,
    defaultValue,
    filter,
}: {
    label: string;
    placeholder: string;
    defaultValue?: string;
    filter?: Filter;
}) {
    const t = useT();
    const [picked, setPicked] = useState(filter?.value ?? '');

    const hint =
        filter?.options.find((option) => option.value === picked)
            ?.placeholder ?? placeholder;

    return (
        <Form
            action=""
            replace
            scroll={false}
            role="search"
            onSubmit={(event) => {
                // The props are what the URL already says: sending the same
                // search again would only reload the list it is showing.
                const sent = new FormData(event.currentTarget);
                const sameQuery =
                    String(sent.get('q') ?? '').trim() === (defaultValue ?? '');
                const sameFilter =
                    !filter ||
                    (sent.get(filter.name) ?? '') === (filter.value ?? '');
                if (sameQuery && sameFilter) event.preventDefault();
            }}
            className="space-y-3"
        >
            <div className={searchFrameClass}>
                <input
                    type="search"
                    name="q"
                    defaultValue={defaultValue}
                    aria-label={label}
                    placeholder={hint}
                    enterKeyHint="search"
                    autoComplete="off"
                    spellCheck={false}
                    className={searchInputClass}
                />
                <button
                    type="submit"
                    aria-label={t('search.submit')}
                    title={t('search.submit')}
                    className={searchSubmitClass}
                >
                    <Search
                        size={18}
                        strokeWidth={2.5}
                        aria-hidden
                    />
                </button>
            </div>

            {filter && (
                <fieldset className="-mx-1.5 min-w-0 overflow-x-auto px-1.5 py-0.5">
                    <legend className="sr-only">{filter.label}</legend>
                    <div className="flex w-max gap-2">
                        {filter.options.map((option) => {
                            const selected = option.value === picked;
                            return (
                                <label
                                    key={option.value}
                                    className={`lift font-display has-focus-visible:outline-pulse relative inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md border-2 px-3 py-2 text-sm font-bold tracking-wide uppercase has-focus-visible:outline-3 has-focus-visible:outline-offset-2 ${
                                        selected
                                            ? 'border-pulse text-pulse'
                                            : 'border-line text-muted hover:border-pulse hover:text-pulse'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name={filter.name}
                                        value={option.value}
                                        checked={selected}
                                        onChange={(event) => {
                                            setPicked(option.value);
                                            event.currentTarget.form?.requestSubmit();
                                        }}
                                        className="sr-only"
                                    />
                                    {option.label}
                                    {option.count !== undefined && (
                                        <span
                                            className={`figure text-xs ${
                                                option.count === 0
                                                    ? 'opacity-50'
                                                    : ''
                                            }`}
                                        >
                                            {option.count}
                                        </span>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                </fieldset>
            )}
        </Form>
    );
}
