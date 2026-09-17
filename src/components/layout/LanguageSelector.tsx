import { LOCALES, LOCALE_LABELS, useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label={t("a11y.languageLabel")}
    >
      {LOCALES.map((code, index) => (
        <span key={code} className="flex items-center">
          {index > 0 && (
            <span aria-hidden="true" className="px-1 text-primary-foreground/40">
              |
            </span>
          )}
          <button
            type="button"
            lang={code}
            onClick={() => setLocale(code)}
            aria-pressed={locale === code}
            className={cn(
              "min-h-11 rounded-sm px-2 text-sm font-medium transition-colors",
              locale === code
                ? "bg-primary-foreground/15 text-primary-foreground underline underline-offset-4"
                : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
            )}
          >
            {LOCALE_LABELS[code]}
          </button>
        </span>
      ))}
    </div>
  );
}
