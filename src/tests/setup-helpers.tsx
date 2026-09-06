import { I18nProvider } from "@/i18n/I18nProvider";
import { dictionaries, type Locale } from "@/i18n/config";
import { render } from "@testing-library/react";

/** Renders inside a locale provider. Without it components fall back to English. */
export function renderWithLocale(ui: React.ReactElement, locale: Locale = "en") {
  return render(
    <I18nProvider locale={locale} dict={dictionaries[locale]}>
      {ui}
    </I18nProvider>,
  );
}

/** A no-op form action, for forms whose submission is not under test. */
export const noopAction = async () => ({});
