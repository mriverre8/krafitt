'use client';

/**
 * The signed-out home page. Its argument is that the app is worth typing an
 * email into, and the only honest way to make it is to hand over the app: the
 * training screen and the history grid below are the product's own components
 * (see `components/landing/demos.tsx`). No screenshots, no invented numbers of
 * users, no testimonials.
 *
 * What the editor can hold is told rather than shown: its limits are numbers,
 * and a spec read straight off `lib/constants.ts` says more in one glance than
 * a form you have to poke at to discover.
 */

import { useT } from '@/i18n/use-t';
import { CHIPS, editorSpecs } from '@/lib/landing';
import { badgeClass, cardClass, ghostClass, primaryClass } from '@/lib/ui';
import { ArrowDown } from 'lucide-react';
import { AuthForms } from '@/components/auth/auth-forms';
import { Wordmark } from '@/components/ui/wordmark';
import { ProgressDemo } from '@/components/landing/progress-demo';
import { TodayPreview } from '@/components/landing/today-preview';
import { Section } from '@/components/landing/section';

export function Landing() {
    const t = useT();

    return (
        <div
            data-landing
            className="space-y-20 py-4 sm:space-y-28"
        >
            <header className="space-y-6">
                <h1 className="text-7xl sm:text-8xl">
                    <Wordmark />
                </h1>
                <p className="text-ink max-w-md text-xl font-medium text-balance">
                    {t('app.tagline')}
                </p>
                <p className="text-muted max-w-lg text-base text-pretty">
                    {t('landing.lead')}
                </p>

                <div className="flex flex-wrap items-stretch gap-3">
                    <a
                        href="#join"
                        className={`${primaryClass} inline-flex items-center justify-center gap-2`}
                    >
                        {t('landing.ctaStart')}
                    </a>
                    <a
                        href="#today"
                        className={`${ghostClass} inline-flex items-center justify-center gap-2`}
                    >
                        {t('landing.ctaTour')}
                        <ArrowDown
                            size={14}
                            aria-hidden
                        />
                    </a>
                </div>

                <ul className="flex flex-wrap gap-2">
                    {CHIPS.map((key) => (
                        <li
                            key={key}
                            className={`${badgeClass} border-line text-muted border-2`}
                        >
                            {t(key)}
                        </li>
                    ))}
                </ul>
            </header>

            <Section
                id="today"
                eyebrow="landing.todayEyebrow"
                title="landing.todayTitle"
                lead="landing.feature3"
                note="landing.feature2"
            >
                <TodayPreview />
            </Section>

            <Section
                id="editor"
                eyebrow="landing.editorEyebrow"
                title="landing.editorTitle"
                lead="landing.feature1"
            >
                <ul className="grid gap-3 sm:grid-cols-2">
                    {editorSpecs(t).map(
                        ({ stat, Icon, title, body, chips }) => (
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
                                <p className="text-muted text-sm text-pretty">
                                    {body}
                                </p>
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
                        )
                    )}
                </ul>
            </Section>

            <Section
                id="progress"
                eyebrow="landing.progressEyebrow"
                title="landing.progressTitle"
                lead="landing.progressLead"
            >
                <ProgressDemo />
            </Section>

            <Section
                id="join"
                eyebrow="landing.joinEyebrow"
                title="landing.joinTitle"
                lead="landing.joinLead"
            >
                <AuthForms />
            </Section>
        </div>
    );
}
