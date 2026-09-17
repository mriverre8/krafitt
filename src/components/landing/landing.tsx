'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass, ghostClass, primaryClass } from '@/lib/ui';
import { ArrowDown } from 'lucide-react';
import { AuthForms } from '@/components/auth/auth-forms';
import { Wordmark } from '@/components/ui/wordmark';
import { ProgressPreview } from '@/components/landing/progress-preview';
import { TodayPreview } from '@/components/landing/today-preview';
import { EditorSpecs } from '@/components/landing/editor-specs';
import { Section } from '@/components/landing/section';
import { CHIPS } from '@/lib/landing';

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
                <EditorSpecs />
            </Section>

            <Section
                id="progress"
                eyebrow="landing.progressEyebrow"
                title="landing.progressTitle"
                lead="landing.progressLead"
            >
                <ProgressPreview />
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
