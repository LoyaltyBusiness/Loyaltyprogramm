import { createContext, useContext } from "react";
import { dictionary, type Locale } from "./content.ts";

export type LocaleValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  copy: (typeof dictionary)["de"];
};

export const LocaleContext = createContext<LocaleValue | null>(null);

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used within LocaleProvider");
  return value;
}
