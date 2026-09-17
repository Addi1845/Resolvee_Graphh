import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Images, RefreshCw } from "lucide-react";

import { useI18n } from "@/i18n";
import {
  CATEGORIES,
  STATUSES,
  getComplaintEvidence,
  getMyAccess,
  listComplaints,
  updateComplaintStatus,
} from "@/lib/complaints.functions";
import { PRIORITY_POLICY } from "@/lib/policy";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Complaint Dashboard — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Officer dashboard for reviewing complaints by impact score, deadline and department queue.",
      },
      { property: "og:title", content: "Complaint Dashboard — ResolveGraph AI" },
      { property: "og:description", content: "Officer workspace for ResolveGraph AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

type ListResult = Awaited<ReturnType<typeof listComplaints>>;
type Complaint = ListResult["complaints"][number];
type PriorityFactor = { code: string; value: number | null; weight: number; reason: string };

const fieldClass =
  "rounded-sm border border-border-strong bg-surface px-3 py-2.5 text-base text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-ring";

const bandClass: Record<string, string> = {
  critical: "bg-destructive-soft text-destructive-foreground border-destructive/40",
  high: "bg-warning-soft text-warning-foreground border-warning/40",
  medium: "bg-info-soft text-primary border-secondary/40",
  low: "bg-muted text-muted-foreground border-border",
};

function DashboardPage() {
  const { t, formatDate } = useI18n();
  const fetchList = useServerFn(listComplaints);
  const fetchAccess = useServerFn(getMyAccess);
  const fetchEvidence = useServerFn(getComplaintEvidence);
  const saveStatus = useServerFn(updateComplaintStatus);

  const [roles, setRoles] = useState<string[] | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [summary, setSummary] = useState<ListResult["summary"] | null>(null);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("priority");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openWhy, setOpenWhy] = useState<Record<string, boolean>>({});
  const [evidence, setEvidence] = useState<Record<string, { id: string; url: string }[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchList({ data: { status, search, category, sort } });
      setComplaints(result.complaints);
      setSummary(result.summary);
    } finally {
      setLoading(false);
    }
  }, [fetchList, status, search, category, sort]);

  useEffect(() => {
    void fetchAccess({ data: undefined }).then((result) => setRoles(result.roles));
  }, [fetchAccess]);

  useEffect(() => {
    void load();
  }, [load]);

  const isStaff = roles?.some((role) => role !== "citizen") ?? false;
  const today = new Date().toISOString().slice(0, 10);

  async function handleUpdate(id: string, next: string) {
    setSavingId(id);
    try {
      await saveStatus({ data: { id, status: next, note: notes[id] ?? "" } });
      setNotes((prev) => ({ ...prev, [id]: "" }));
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function loadEvidence(id: string) {
    if (evidence[id]) return setEvidence((prev) => ({ ...prev, [id]: prev[id]! }));
    const result = await fetchEvidence({ data: { id } });
    setEvidence((prev) => ({ ...prev, [id]: result.photos }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-primary">{t("app.dashboard.title")}</h1>
      <p className="mt-2 text-base text-muted-foreground">{t("app.dashboard.intro")}</p>

      {roles && !isStaff ? (
        <div className="mt-6 rounded-sm border border-warning/40 bg-warning-soft p-5">
          <p className="text-base font-bold text-warning-foreground">
            {t("app.dashboard.noAccess")}
          </p>
          <p className="mt-1 text-base text-foreground">{t("app.dashboard.noAccessText")}</p>
        </div>
      ) : null}

      {summary ? (
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("app.dashboard.filterAll"), value: summary.total },
            { label: t("app.analysis.bands.critical"), value: summary.critical },
            { label: t("app.track.due"), value: summary.overdue },
            { label: t("app.statuses.in_progress"), value: summary.open },
          ].map((card) => (
            <div key={card.label} className="rounded-sm border border-border bg-surface p-4">
              <dt className="text-sm font-semibold text-muted-foreground">{card.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-primary">{card.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-8 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-foreground">
            {t("app.track.status")}
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`mt-1.5 ${fieldClass}`}
          >
            <option value="">{t("app.dashboard.filterAll")}</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {t(`app.statuses.${item}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-foreground">
            {t("app.report.category")}
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`mt-1.5 ${fieldClass}`}
          >
            <option value="">{t("app.dashboard.filterAll")}</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {t(`app.categories.${item}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="block text-sm font-semibold text-foreground">
            {t("app.analysis.priority")}
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={`mt-1.5 ${fieldClass}`}
          >
            <option value="priority">{t("app.analysis.priority")}</option>
            <option value="deadline">{t("app.track.due")}</option>
            <option value="newest">{t("app.track.filed")}</option>
            <option value="oldest">{t("app.dashboard.searchLabel")}</option>
          </select>
        </div>
        <div>
          <label htmlFor="search" className="block text-sm font-semibold text-foreground">
            {t("app.dashboard.searchLabel")}
          </label>
          <input
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`mt-1.5 ${fieldClass}`}
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border-strong px-4 text-sm font-semibold text-foreground hover:bg-muted"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          {t("app.common.retry")}
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-base text-muted-foreground">{t("app.common.loading")}</p>
      ) : complaints.length === 0 ? (
        <p className="mt-8 text-base text-muted-foreground">{t("app.dashboard.empty")}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {complaints.map((complaint) => {
            const factors =
              ((complaint.priority_factors as { factors?: PriorityFactor[] } | null)?.factors ??
                []) as PriorityFactor[];
            const urgent =
              (complaint.priority_factors as { urgent_review?: boolean } | null)?.urgent_review ===
              true;
            const overdue =
              complaint.due_date !== null &&
              complaint.due_date < today &&
              !["resolved", "rejected"].includes(complaint.status);

            return (
              <li
                key={complaint.id}
                className="rounded-sm border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {complaint.tracking_code} · {t(`app.categories.${complaint.category}`)}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {complaint.priority_band ? (
                      <span
                        className={`rounded-sm border px-3 py-1 text-sm font-bold ${
                          bandClass[complaint.priority_band] ?? bandClass['low']
                        }`}
                      >
                        {t(`app.analysis.bands.${complaint.priority_band}`)} ·{" "}
                        {complaint.priority_score ?? "—"}/100
                      </span>
                    ) : null}
                    <span className="rounded-sm bg-info-soft px-3 py-1 text-sm font-bold text-primary">
                      {t(`app.statuses.${complaint.status}`)}
                    </span>
                  </div>
                </div>

                <h2 className="mt-1 text-xl font-bold text-primary">{complaint.title}</h2>
                <p className="mt-2 whitespace-pre-line text-base text-foreground">
                  {complaint.description}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {complaint.location_text} · {formatDate(complaint.created_at)}
                  {complaint.reporter_name
                    ? ` · ${t("app.dashboard.reporter")}: ${complaint.reporter_name}`
                    : ""}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(`app.location.states.${complaint.proximity_state}`)}
                  {complaint.proximity_distance_m !== null
                    ? ` · ${Math.round(complaint.proximity_distance_m)} m`
                    : ""}
                </p>
                {complaint.due_date ? (
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      overdue ? "text-destructive-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t("app.track.due")}: {complaint.due_date}
                  </p>
                ) : null}

                {urgent ? (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-sm border border-destructive/40 bg-destructive-soft px-3 py-2 text-sm font-semibold text-destructive-foreground">
                    <AlertTriangle aria-hidden="true" className="size-4" />
                    {t("app.analysis.urgent")}
                  </p>
                ) : null}

                <div className="mt-3 rounded-sm border border-border bg-muted/40 p-3 text-sm">
                  <p className="font-semibold text-foreground">
                    {t("app.analysis.demoLabel")} · {t("app.analysis.suggested")}:{" "}
                    {complaint.suggested_category
                      ? t(`app.categories.${complaint.suggested_category}`)
                      : t("app.analysis.noSuggestion")}
                  </p>
                  <p className="mt-1 text-muted-foreground">{t("app.analysis.needsReview")}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenWhy((prev) => ({ ...prev, [complaint.id]: !prev[complaint.id] }))
                    }
                    className="mt-2 text-sm font-semibold text-secondary underline"
                  >
                    {t("app.analysis.whyTitle")}
                  </button>
                  {openWhy[complaint.id] ? (
                    <ul className="mt-2 space-y-1">
                      {factors.map((factor) => (
                        <li key={factor.code} className="text-muted-foreground">
                          <span className="font-semibold text-foreground">{factor.code}</span> ·{" "}
                          {factor.value === null ? t("app.analysis.unknown") : factor.value} ·{" "}
                          {Math.round(factor.weight * 100)}% · {factor.reason}
                        </li>
                      ))}
                      <li className="text-muted-foreground">policy: {PRIORITY_POLICY.version}</li>
                    </ul>
                  ) : null}
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => void loadEvidence(complaint.id)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-secondary underline"
                  >
                    <Images aria-hidden="true" className="size-4" />
                    {t("app.media.title")}
                  </button>
                  {evidence[complaint.id] ? (
                    evidence[complaint.id]!.length === 0 ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {t("app.wizard.noPhotos")}
                      </p>
                    ) : (
                      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {evidence[complaint.id]!.map((photo) => (
                          <li key={photo.id}>
                            <img
                              src={photo.url}
                              alt=""
                              className="h-28 w-full rounded-sm border border-border object-cover"
                            />
                          </li>
                        ))}
                      </ul>
                    )
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <div className="min-w-56 flex-1">
                    <label
                      htmlFor={`note-${complaint.id}`}
                      className="block text-sm font-semibold text-foreground"
                    >
                      {t("app.dashboard.note")}
                    </label>
                    <input
                      id={`note-${complaint.id}`}
                      value={notes[complaint.id] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [complaint.id]: e.target.value }))
                      }
                      className={`mt-1.5 w-full ${fieldClass}`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`status-${complaint.id}`}
                      className="block text-sm font-semibold text-foreground"
                    >
                      {t("app.dashboard.updateStatus")}
                    </label>
                    <select
                      id={`status-${complaint.id}`}
                      value={complaint.status}
                      disabled={!isStaff || savingId === complaint.id}
                      onChange={(e) => void handleUpdate(complaint.id, e.target.value)}
                      className={`mt-1.5 ${fieldClass}`}
                    >
                      {STATUSES.map((item) => (
                        <option key={item} value={item}>
                          {t(`app.statuses.${item}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
