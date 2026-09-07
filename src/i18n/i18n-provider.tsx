"use client";

import { createContext } from "react";
import type { Dict, Locale } from "./config";

export type I18nValue = { locale: Locale; dict: Dict };

export const I18nContext = createContext<I18nValue | null>(null);

/** The layout resolves the locale on the server and hands the dictionary down. */
export function I18nProvider({
  locale,
  dict,
  children,
}: I18nValue & { children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}
