import { useState } from "react";
import { Contrast, Keyboard, Minus, Plus, RotateCcw } from "lucide-react";

import { useAccessibility } from "@/components/a11y/AccessibilityProvider";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

const buttonClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-sm px-2 text-sm font-medium text-primary-foreground/85 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground disabled:opacity-40 disabled:hover:bg-transparent";

export function AccessibilityControls({ className }: { className?: string }) {
  const { t } = useI18n();
  const { increase, decrease, reset, canIncrease, canDecrease, highContrast, toggleContrast } =
    useAccessibility();
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      <div className="flex items-center gap-0.5" role="group" aria-label={t("a11y.controlsLabel")}>
        <button
          type="button"
          onClick={decrease}
          disabled={!canDecrease}
          className={buttonClass}
          title={t("a11y.decreaseText")}
        >
          <Minus aria-hidden="true" className="size-4" />
          <span className="sr-only">{t("a11y.decreaseText")}</span>
          <span aria-hidden="true">A</span>
        </button>
        <button
          type="button"
          onClick={increase}
          disabled={!canIncrease}
          className={buttonClass}
          title={t("a11y.increaseText")}
        >
          <Plus aria-hidden="true" className="size-4" />
          <span className="sr-only">{t("a11y.increaseText")}</span>
          <span aria-hidden="true" className="text-base">
            A
          </span>
        </button>
        <button type="button" onClick={reset} className={buttonClass} title={t("a11y.resetText")}>
          <RotateCcw aria-hidden="true" className="size-4" />
          <span className="sr-only">{t("a11y.resetText")}</span>
        </button>
        <button
          type="button"
          onClick={toggleContrast}
          aria-pressed={highContrast}
          className={buttonClass}
          title={t("a11y.highContrast")}
        >
          <Contrast aria-hidden="true" className="size-4" />
          <span className="sr-only">
            {t("a11y.highContrast")} —{" "}
            {highContrast ? t("a11y.highContrastOn") : t("a11y.highContrastOff")}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setShowKeyboardHelp((v) => !v)}
          aria-expanded={showKeyboardHelp}
          className={buttonClass}
          title={t("a11y.keyboardHelp")}
        >
          <Keyboard aria-hidden="true" className="size-4" />
          <span className="sr-only">{t("a11y.keyboardHelp")}</span>
        </button>
      </div>
      {showKeyboardHelp && (
        <p className="max-w-xs rounded-sm bg-primary-foreground/10 p-2 text-xs leading-relaxed text-primary-foreground">
          {t("a11y.keyboardHelpText")}
        </p>
      )}
    </div>
  );
}
