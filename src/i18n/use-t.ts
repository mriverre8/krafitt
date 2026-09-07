"use client";

import { useContext, useMemo } from "react";
import { createT, DEFAULT_LOCALE, dictionaries } from "./config";
import { I18nContext } from "./i18n-provider";

/** Translator for client components. Falls back to English outside a provider. */
export function useT() {
  const value = useContext(I18nContext);
  const dict = value?.dict ?? dictionaries[DEFAULT_LOCALE];
  return useMemo(() => createT(dict), [dict]);
}

export function useLocale() {
  return useContext(I18nContext)?.locale ?? DEFAULT_LOCALE;
}
