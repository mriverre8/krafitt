import { NavBar } from "@/components/NavBar";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getDictionary, getLocale } from "@/i18n/server";
import { currentUser } from "@/lib/auth";
import { getTheme } from "@/lib/theme-server";
import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Krafitt",
  description: "Track your gym progress",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [user, theme, locale, dict] = await Promise.all([
    currentUser(),
    getTheme(),
    getLocale(),
    getDictionary(),
  ]);

  return (
    <html
      lang={locale}
      className={`${display.variable} h-full antialiased ${theme === "dark" ? "dark" : ""}`}
    >
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale} dict={dict}>
          <header className="border-b border-line">
            <NavBar signedIn={!!user} theme={theme} />
          </header>
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
