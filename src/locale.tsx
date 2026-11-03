import { useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionary, type Locale } from "./content.ts";
import { LocaleContext } from "./useLocale.ts";

const STORAGE_KEY = "kafteji.lang";

function initialLocale(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "de";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const copy = dictionary[locale];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, copy }),
    [locale, copy],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}
