import { Wordmark } from '@/components/ui/wordmark';
import { getT } from '@/i18n/server';
import { iconButtonClass } from '@/lib/ui';
import { AtSign, Code, Mail } from 'lucide-react';
import Link from 'next/link';
import pkg from '../../../package.json';

const GITHUB_USER = 'mriverre8';
export const REPO_URL = `https://github.com/${GITHUB_USER}/krafitt`;
const PROFILE_URL = `https://github.com/${GITHUB_USER}`;
const EMAIL = 'krafitt@gmail.com';

const legalClass =
    'eyebrow text-muted hover:text-pulse inline-flex min-h-11 items-center transition-colors';

export async function Footer() {
    const t = await getT();

    return (
        <footer className="border-line bg-bg/60 border-t">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
                <div className="flex items-center gap-2.5">
                    <Wordmark className="text-2xl" />
                    <span className="figure text-muted text-xs">
                        v{pkg.version}
                    </span>
                </div>

                <nav
                    aria-label={t('footer.project')}
                    className="-mx-2 flex items-center gap-1"
                >
                    <a
                        href={REPO_URL}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t('footer.source')}
                        title={t('footer.source')}
                        className={iconButtonClass}
                    >
                        <Code
                            size={16}
                            aria-hidden
                        />
                    </a>
                    <a
                        href={PROFILE_URL}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t('footer.profile')}
                        title={t('footer.profile')}
                        className={iconButtonClass}
                    >
                        <AtSign
                            size={16}
                            aria-hidden
                        />
                    </a>
                    <a
                        href={`mailto:${EMAIL}`}
                        aria-label={t('footer.contact')}
                        title={t('footer.contact')}
                        className={iconButtonClass}
                    >
                        <Mail
                            size={16}
                            aria-hidden
                        />
                    </a>
                </nav>
            </div>

            <div className="border-line/60 border-t">
                <div className="mx-auto max-w-3xl px-4 pb-4">
                    <nav
                        aria-label={t('footer.legal')}
                        className="flex flex-wrap items-center justify-center gap-x-5 md:justify-start"
                    >
                        <Link
                            href="/legal/privacy"
                            className={legalClass}
                        >
                            {t('legal.privacy')}
                        </Link>
                        <Link
                            href="/legal/terms"
                            className={legalClass}
                        >
                            {t('legal.terms')}
                        </Link>
                        <Link
                            href="/legal/cookies"
                            className={legalClass}
                        >
                            {t('legal.cookies')}
                        </Link>
                    </nav>
                    <p className="text-muted text-center text-xs md:text-left">
                        {t('footer.rights', { year: new Date().getFullYear() })}
                    </p>
                </div>
            </div>
        </footer>
    );
}
