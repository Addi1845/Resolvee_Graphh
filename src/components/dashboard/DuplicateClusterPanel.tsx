import { Link } from "@tanstack/react-router";
import { Layers } from "lucide-react";

import { useI18n } from "@/i18n";
import { MapPanel } from "@/components/map/MapPanel";
import { ResolutionGraph } from "@/components/complaint/ResolutionGraph";

type Side = {
  id: string;
  tracking_code: string;
  title: string;
  location_text: string;
  status: string;
  category: string;
  priority_band: string | null;
  priority_score: number | null;
  due_date: string | null;
  issue_lat: number | null;
  issue_lng: number | null;
  created_at: string;
};

export type Cluster = {
  kept: Side;
  members: {
    linkId: string;
    similarity: number;
    reason: string | null;
    state: string;
    complaint: Side;
  }[];
  reportCount: number;
  pendingCount: number;
  confirmedCount: number;
};

/**
 * Grouped reports about one real problem. One report is kept as the working
 * case; the others are linked to it only after an officer agrees.
 */
export function DuplicateClusterPanel({
  clusters,
  canReview,
  savingId,
  onDecide,
  loading,
}: {
  clusters: Cluster[];
  canReview: boolean;
  savingId: string | null;
  onDecide: (linkId: string, state: "confirmed" | "rejected") => void;
  loading: boolean;
}) {
  const { t, formatDate } = useI18n();

  return (
    <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-primary">{t("app.cluster.title")}</h2>
        <Layers aria-hidden="true" className="size-5 text-secondary" />
      </div>
      <p className="mt-1 text-base text-muted-foreground">{t("app.cluster.intro")}</p>

      {clusters.length === 0 ? (
        <p className="mt-4 text-base text-muted-foreground">
          {loading ? t("app.common.loading") : t("app.cluster.empty")}
        </p>
      ) : (
        <ul className="mt-5 space-y-6">
          {clusters.map((cluster) => {
            const points = [cluster.kept, ...cluster.members.map((member) => member.complaint)]
              .filter((row) => row.issue_lat !== null && row.issue_lng !== null)
              .map((row) => ({
                id: row.id,
                lat: row.issue_lat as number,
                lng: row.issue_lng as number,
                title: `${row.tracking_code} · ${row.title}`,
                subtitle: row.location_text,
                band: row.priority_band,
              }));

            return (
              <li key={cluster.kept.id} className="rounded-sm border border-border-strong p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold uppercase tracking-wider text-primary">
                    {t("app.cluster.count", { count: String(cluster.reportCount) })}
                  </p>
                  {cluster.pendingCount > 0 ? (
                    <span className="rounded-sm border border-warning/40 bg-warning-soft px-3 py-1 text-sm font-bold text-warning-foreground">
                      {t("app.cluster.pending", { count: String(cluster.pendingCount) })}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                  <div>
                    <div className="rounded-sm border border-success/40 bg-success-soft p-3">
                      <p className="text-sm font-bold uppercase tracking-wider text-primary">
                        {t("app.cluster.kept")} · {cluster.kept.tracking_code}
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {cluster.kept.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {cluster.kept.location_text} · {t(`app.statuses.${cluster.kept.status}`)}
                        {cluster.kept.priority_score !== null
                          ? ` · ${cluster.kept.priority_score}/100`
                          : ""}
                      </p>
                      <Link
                        to="/complaints/$code"
                        params={{ code: cluster.kept.tracking_code }}
                        className="mt-2 inline-block text-sm font-semibold text-secondary underline"
                      >
                        {t("app.cluster.openKept")}
                      </Link>
                    </div>

                    <ul className="mt-3 space-y-2">
                      {cluster.members.map((member) => (
                        <li
                          key={member.linkId}
                          className="rounded-sm border border-border bg-muted/30 p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                              {t("app.cluster.linked")} · {member.complaint.tracking_code}
                            </p>
                            <span className="rounded-sm bg-info-soft px-2.5 py-1 text-sm font-bold text-primary">
                              {t("app.review.dupMatch")}: {Math.round(member.similarity)}/100
                            </span>
                          </div>
                          <p className="mt-1 text-base font-semibold text-foreground">
                            {member.complaint.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.complaint.location_text} ·{" "}
                            {formatDate(member.complaint.created_at)}
                          </p>
                          {member.reason ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {t("app.cluster.why")}: {member.reason}
                            </p>
                          ) : null}
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {member.state === "confirmed"
                              ? t("app.review.stateConfirmed")
                              : member.state === "rejected"
                                ? t("app.review.stateRejected")
                                : t("app.review.stateSuggested")}
                          </p>

                          {member.state === "suggested" && canReview ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={savingId === member.linkId}
                                onClick={() => onDecide(member.linkId, "confirmed")}
                                className="inline-flex min-h-11 items-center rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-secondary disabled:opacity-60"
                              >
                                {t("app.review.confirm")}
                              </button>
                              <button
                                type="button"
                                disabled={savingId === member.linkId}
                                onClick={() => onDecide(member.linkId, "rejected")}
                                className="inline-flex min-h-11 items-center rounded-sm border border-border-strong px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                              >
                                {t("app.review.reject")}
                              </button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid gap-4">
                    <MapPanel title={t("app.cluster.map")} points={points} height={240} />
                    <ResolutionGraph status={cluster.kept.status} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
