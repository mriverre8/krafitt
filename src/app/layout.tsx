import { NavBar } from '@/components/nav-bar';
import { I18nProvider } from '@/i18n/i18n-provider';
import { getDictionary, getLocale } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { getTheme } from '@/lib/theme-server';
import type { Metadata } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import './globals.css';

// The Sports/Fitness pairing: condensed for impact, regular for everything read.
const display = Barlow_Condensed({
    variable: '--font-barlow-condensed',
    subsets: ['latin'],
    weight: ['600', '700', '800'],
});

const body = Barlow({
    variable: '--font-barlow',
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
    title: 'Krafitt',
    description: 'Track your gym progress',
};

export default async function RootLayout({ children }: LayoutProps<'/'>) {
    const [user, theme, locale, dict] = await Promise.all([
        currentUser(),
        getTheme(),
        getLocale(),
        getDictionary(),
    ]);

    return (
        <html
            lang={locale}
            className={`${display.variable} ${body.variable} h-full antialiased ${
                theme === 'dark' ? 'dark' : ''
            }`}
        >
            <body className="flex min-h-full flex-col">
                <I18nProvider
                    locale={locale}
                    dict={dict}
                >
                    <header className="border-line bg-bg/90 sticky top-0 z-10 border-b backdrop-blur">
                        <NavBar
                            userName={user?.name ?? null}
                            theme={theme}
                        />
                    </header>
                    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
                        {children}
                    </main>
                </I18nProvider>
            </body>
        </html>
    );
}
