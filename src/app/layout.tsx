import { ModalHost } from '@/components/modal/modal-host';
import { Footer } from '@/components/chrome/footer';
import { NavBar } from '@/components/chrome/nav-bar';
import { I18nProvider } from '@/i18n/i18n-provider';
import { getDictionary, getLocale } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { bodyFont, displayFont } from '@/lib/fonts';
import { getTheme } from '@/lib/theme-server';
import type { Metadata, Viewport } from 'next';
import './globals.css';

// The price of sub-16px fields: iOS Safari zooms into any focused input whose
// font-size is under 16px, and capping the scale is the only thing that stops
// it. Costs pinch-to-zoom on the whole app (WCAG 1.4.4).
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export const metadata: Metadata = {
    title: 'Krafitt',
    description: 'Track your gym progress',
    appleWebApp: {
        title: 'Krafitt',
    },
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
            className={`${displayFont.variable} ${bodyFont.variable} h-full antialiased ${
                theme === 'dark' ? 'dark' : ''
            }`}
        >
            <body className="flex min-h-full flex-col">
                <I18nProvider
                    locale={locale}
                    dict={dict}
                >
                    <header className="border-line bg-bg/80 sticky top-0 z-20 border-b backdrop-blur-md">
                        <NavBar
                            userName={user?.name ?? null}
                            userImage={user?.image ?? null}
                            theme={theme}
                        />
                        <div
                            aria-hidden
                            className="from-volt via-pulse h-px bg-linear-to-r to-transparent opacity-60"
                        />
                    </header>
                    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
                        {children}
                    </main>
                    <Footer />
                    <ModalHost />
                </I18nProvider>
            </body>
        </html>
    );
}
