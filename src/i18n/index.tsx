import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { en, type Dictionary } from "./locales/en";
import { hi } from "./locales/hi";
import { mr } from "./locales/mr";

export const LOCALES = ["en", "hi", "mr"] as const;
export type Locale = (typeof LOCALES)[number];

const dictionaries: Record<Locale, Dictionary> = { en, hi, mr };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
};

const INTL_LOCALE: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

const STORAGE_KEY = "resolvegraph.locale";

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

function readStoredLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${STORAGE_KEY}=`))
    ?.split("=")[1];
  return isLocale(cookie) ? cookie : null;
}

function persistLocale(locale: Locale) {
  if (typeof document === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable */
  }
  document.cookie = `${STORAGE_KEY}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

type Path = string;

function resolvePath(dict: Dictionary, path: Path): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === "object" ? (acc as Record<string, unknown>)[key] : undefined,
      dict,
    );
}

type I18nValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dict: Dictionary;
  /** Translate a dot-path key to a string. */
  t: (path: Path) => string;
  formatDate: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored && stored !== locale) setLocaleState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[locale];
    return {
      locale,
      setLocale,
      dict,
      t: (path) => {
        const found = resolvePath(dict, path);
        if (typeof found === "string") return found;
        const fallback = resolvePath(en, path);
        return typeof fallback === "string" ? fallback : path;
      },
      formatDate: (val, options) =>
        new Intl.DateTimeFormat(INTL_LOCALE[locale], {
          dateStyle: "long",
          timeStyle: "short",
          ...options,
        }).format(new Date(val)),
      formatNumber: (val, options) => new Intl.NumberFormat(INTL_LOCALE[locale], options).format(val),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
