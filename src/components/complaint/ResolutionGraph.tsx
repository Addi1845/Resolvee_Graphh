import { Check, CircleDot, Circle, XCircle } from "lucide-react";

import { useI18n } from "@/i18n";

const STAGES = [
  "submitted",
  "acknowledged",
  "assigned",
  "in_progress",
  "awaiting_verification",
  "resolved",
] as const;

/**
 * Resolution graph for one complaint: which stages are finished, which stage the
 * work is sitting on now, and what is still pending. Stage history comes from the
 * complaint timeline, so nothing here is guessed.
 */
export function ResolutionGraph({
  status,
  reachedStatuses = [],
  canEdit = false,
  onSelect,
  savingStage = null,
  message = null,
}: {
  status: string;
  reachedStatuses?: string[];
  /** Officers with write access can move the complaint to another stage. */
  canEdit?: boolean;
  onSelect?: (stage: string) => void;
  savingStage?: string | null;
  message?: string | null;
}) {
  const { t } = useI18n();
  const rejected = status === "rejected";
  const currentIndex = STAGES.indexOf(status as (typeof STAGES)[number]);
  const reached = new Set(reachedStatuses);

  const done = STAGES.filter(
    (stage, index) => index < currentIndex || reached.has(stage) || status === "resolved",
  ).length;
  const percent = Math.round((Math.max(done, currentIndex + (rejected ? 0 : 1)) / STAGES.length) * 100);

  return (
    <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-bold text-primary">{t("app.graph.title")}</h2>
        <span className="text-sm text-muted-foreground">{t("app.graph.note")}</span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${rejected ? "bg-destructive" : "bg-secondary"}`}
          style={{ width: `${rejected ? 100 : percent}%` }}
        />
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">
        {rejected
          ? t("app.statuses.rejected")
          : t("app.graph.progress", { percent: String(percent) })}
      </p>

      <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage, index) => {
          const isDone = !rejected && (index < currentIndex || status === "resolved");
          const isCurrent = !rejected && index === currentIndex && status !== "resolved";
          return (
            <li
              key={stage}
              className={`flex items-start gap-3 rounded-sm border p-3 ${
                isCurrent
                  ? "border-secondary bg-info-soft"
                  : isDone
                    ? "border-success/40 bg-success-soft"
                    : "border-border bg-muted/30"
              }`}
            >
              <span className="mt-0.5">
                {rejected ? (
                  <XCircle aria-hidden="true" className="size-5 text-destructive" />
                ) : isDone ? (
                  <Check aria-hidden="true" className="size-5 text-success-foreground" />
                ) : isCurrent ? (
                  <CircleDot aria-hidden="true" className="size-5 text-secondary" />
                ) : (
                  <Circle aria-hidden="true" className="size-5 text-muted-foreground" />
                )}
              </span>
              <span>
                <span className="block text-base font-semibold text-foreground">
                  {t(`app.statuses.${stage}`)}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {isDone
                    ? t("app.graph.done")
                    : isCurrent
                      ? t("app.graph.current")
                      : t("app.graph.pending")}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
