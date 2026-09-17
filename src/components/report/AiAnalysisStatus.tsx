import { useEffect, useState } from "react";
import { Brain, Check, Loader2 } from "lucide-react";
import { useI18n } from "@/i18n";

const STAGE_MS = 4500;

/**
 * Shown while a complaint is being submitted and the server-side AI triage is
 * running. The stages are illustrative — the server call is one request — but
 * they tell the citizen what is happening so the pause never feels like a
 * frozen page. All animation is CSS-based and respects reduced motion.
 */
export function AiAnalysisStatus() {
  const { t } = useI18n();
  const stages = [
    t("app.triage.stageSaving"),
    t("app.triage.stageAnalysing"),
    t("app.triage.stageRouting"),
    t("app.triage.stageFinishing"),
  ];

  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => Math.min(current + 1, stages.length - 1));
    }, STAGE_MS);
    return () => window.clearInterval(timer);
  }, [stages.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-md border border-primary/30 bg-primary-soft/40 px-5 py-4"
    >
      <p className="flex items-center gap-2 text-base font-bold text-foreground">
        <Brain aria-hidden="true" className="size-5 animate-pulse text-primary" />
        {t("app.triage.working")}
      </p>
      <ul className="mt-3 space-y-2">
        {stages.map((label, index) => {
          const done = index < active;
          const current = index === active;
          return (
            <li key={label} className="flex items-center gap-2 text-sm">
              {done ? (
                <Check
                  aria-hidden="true"
                  className="size-4 shrink-0 text-success-foreground"
                />
              ) : current ? (
                <Loader2
                  aria-hidden="true"
                  className="size-4 shrink-0 animate-spin text-primary"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="size-4 shrink-0 rounded-full border border-border-strong"
                />
              )}
              <span
                className={
                  done || current
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }
              >
                {label}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        {t("app.triage.workingHint")}
      </p>
    </div>
  );
}
