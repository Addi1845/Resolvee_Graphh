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

      {canEdit ? (
        <p className="mt-3 text-sm font-semibold text-secondary">{t("app.graph.editHint")}</p>
      ) : null}

      <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage, index) => {
          const isDone = !rejected && (index < currentIndex || status === "resolved");
          const isCurrent = !rejected && index === currentIndex && status !== "resolved";
          const isSaving = savingStage === stage;
          const tone = isCurrent
            ? "border-secondary bg-info-soft"
            : isDone
              ? "border-success/40 bg-success-soft"
              : "border-border bg-muted/30";
          const body = (
            <>
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
              <span className="text-left">
                <span className="block text-base font-semibold text-foreground">
                  {t(`app.statuses.${stage}`)}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {isSaving
                    ? t("app.graph.saving")
                    : isDone
                      ? t("app.graph.done")
                      : isCurrent
                        ? t("app.graph.current")
                        : canEdit
                          ? t("app.graph.setStage")
                          : t("app.graph.pending")}
                </span>
              </span>
            </>
          );

          return (
            <li key={stage}>
              {canEdit && onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(stage)}
                  disabled={savingStage !== null || isCurrent}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex w-full items-start gap-3 rounded-sm border p-3 text-left transition-colors ${tone} ${
                    isCurrent
                      ? "cursor-default"
                      : "cursor-pointer hover:border-secondary hover:bg-info-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                  } ${savingStage !== null && !isSaving ? "opacity-60" : ""}`}
                >
                  {body}
                </button>
              ) : (
                <span className={`flex items-start gap-3 rounded-sm border p-3 ${tone}`}>{body}</span>
              )}
            </li>
          );
        })}
      </ol>

      {message ? <p className="mt-4 text-sm font-semibold text-foreground">{message}</p> : null}
    </section>
  );
}
