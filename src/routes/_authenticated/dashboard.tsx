import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Images, RefreshCw } from "lucide-react";

import { useI18n } from "@/i18n";
import { MapPanel } from "@/components/map/MapPanel";
import { WorkloadChart } from "@/components/dashboard/WorkloadChart";
import {
  CATEGORIES,
  STATUSES,
  getComplaintEvidence,
  getDepartmentTracking,
  getMyAccess,
  listComplaints,
  listDuplicateReview,
  listVerificationQueue,
  recordVerification,
  reviewDuplicateLink,
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
type Access = Awaited<ReturnType<typeof getMyAccess>>;
type Tracking = Awaited<ReturnType<typeof getDepartmentTracking>>;
type Duplicates = Awaited<ReturnType<typeof listDuplicateReview>>;
type Verification = Awaited<ReturnType<typeof listVerificationQueue>>;
type TrackingRow = Tracking["departments"][number];
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
  const { t, locale, formatDate } = useI18n();
  const fetchList = useServerFn(listComplaints);
  const fetchAccess = useServerFn(getMyAccess);
  const fetchEvidence = useServerFn(getComplaintEvidence);
  const saveStatus = useServerFn(updateComplaintStatus);

  const fetchTracking = useServerFn(getDepartmentTracking);
  const fetchDuplicates = useServerFn(listDuplicateReview);
  const fetchVerification = useServerFn(listVerificationQueue);
  const saveDuplicate = useServerFn(reviewDuplicateLink);
  const saveVerification = useServerFn(recordVerification);

  const [duplicates, setDuplicates] = useState<Duplicates | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<Record<string, string>>({});
  const [access, setAccess] = useState<Access | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [summary, setSummary] = useState<ListResult["summary"] | null>(null);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("priority");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openWhy, setOpenWhy] = useState<Record<string, boolean>>({});
  const [evidence, setEvidence] = useState<Record<string, { id: string; url: string }[]>>({});

  const isStaff = access?.isStaff ?? false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, departmentResult, duplicateResult, verificationResult] = await Promise.all([
        fetchList({ data: { status, search, category, sort } }),
        fetchTracking({ data: undefined }),
        fetchDuplicates({ data: undefined }),
        fetchVerification({ data: undefined }),
      ]);
      setComplaints(result.complaints);
      setSummary(result.summary);
      setTracking(departmentResult);
      setDuplicates(duplicateResult);
      setVerification(verificationResult);
    } finally {
      setLoading(false);
    }
  }, [
    fetchList,
    fetchTracking,
    fetchDuplicates,
    fetchVerification,
    status,
    search,
    category,
    sort,
  ]);

  useEffect(() => {
    void fetchAccess({ data: undefined }).then(setAccess);
  }, [fetchAccess]);

  useEffect(() => {
    if (!isStaff) {
      setLoading(false);
      return;
    }
    void load();
  }, [isStaff, load]);

  const today = new Date().toISOString().slice(0, 10);

  function departmentName(dept: TrackingRow) {
    return locale === "hi" ? dept.name_hi : locale === "mr" ? dept.name_mr : dept.name_en;
  }

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

  async function handleDuplicate(id: string, state: "confirmed" | "rejected") {
    setSavingId(id);
    try {
      await saveDuplicate({ data: { id, state } });
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function handleVerification(id: string, decision: "verified" | "rework") {
    setSavingId(id);
    try {
      await saveVerification({ data: { id, decision, note: verifyNotes[id] ?? "" } });
      setVerifyNotes((prev) => ({ ...prev, [id]: "" }));
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

  // Citizens never see the official queue, only a pointer to their own area.
  if (access && !isStaff) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">{t("app.dashboard.title")}</h1>
        <div className="mt-6 rounded-sm border border-warning/40 bg-warning-soft p-5">
          <p className="text-base font-bold text-warning-foreground">
            {t("app.dashboard.noAccess")}
          </p>
          <p className="mt-1 text-base text-foreground">{t("app.dashboard.noAccessText")}</p>
        </div>
        <Link
          to="/my-complaints"
          className="mt-6 inline-flex min-h-12 items-center rounded-sm bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-secondary"
        >
          {t("app.auth.myDashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-primary">{t("app.dashboard.title")}</h1>
      <p className="mt-2 text-base text-muted-foreground">{t("app.dashboard.intro")}</p>

      {summary ? (
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("app.depts.total"), value: summary.total },
            { label: t("app.depts.critical"), value: summary.critical },
            { label: t("app.depts.overdue"), value: summary.overdue },
            { label: t("app.depts.open"), value: summary.open },
          ].map((card) => (
            <div key={card.label} className="rounded-sm border border-border bg-surface p-4">
              <dt className="text-sm font-semibold text-muted-foreground">{card.label}</dt>
              <dd className="mt-1 text-2xl font-bold text-primary">{card.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {isStaff ? (
        <section className="mt-10 rounded-sm border border-border bg-surface p-5 shadow-card">
          <h2 className="text-xl font-bold text-primary">{t("app.depts.title")}</h2>
          <p className="mt-1 text-base text-muted-foreground">{t("app.depts.intro")}</p>

          {tracking && (tracking.departments.length > 0 || tracking.unassigned) ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-sm text-muted-foreground">
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {t("app.depts.department")}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {t("app.depts.total")}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {t("app.depts.open")}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {t("app.depts.overdue")}
                    </th>
                    <th scope="col" className="py-2 pr-3 font-semibold">
                      {t("app.depts.critical")}
                    </th>
                    <th scope="col" className="py-2 font-semibold">
                      {t("app.depts.resolved")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tracking.departments.map((dept) => (
                    <tr key={dept.id} className="border-b border-border/70 text-base">
                      <th scope="row" className="py-2.5 pr-3 font-semibold text-foreground">
                        {departmentName(dept)}
                      </th>
                      <td className="py-2.5 pr-3">{dept.total}</td>
                      <td className="py-2.5 pr-3 font-semibold text-primary">{dept.open}</td>
                      <td
                        className={`py-2.5 pr-3 font-semibold ${dept.overdue > 0 ? "text-destructive-foreground" : "text-muted-foreground"}`}
                      >
                        {dept.overdue}
                      </td>
                      <td className="py-2.5 pr-3">{dept.critical}</td>
                      <td className="py-2.5">{dept.resolved}</td>
                    </tr>
                  ))}
                  {tracking.unassigned ? (
                    <tr className="text-base">
                      <th scope="row" className="py-2.5 pr-3 font-semibold text-muted-foreground">
                        {t("app.depts.unassigned")}
                      </th>
                      <td className="py-2.5 pr-3">{tracking.unassigned.total}</td>
                      <td className="py-2.5 pr-3 font-semibold text-primary">
                        {tracking.unassigned.open}
                      </td>
                      <td className="py-2.5 pr-3">{tracking.unassigned.overdue}</td>
                      <td className="py-2.5 pr-3">{tracking.unassigned.critical}</td>
                      <td className="py-2.5">{tracking.unassigned.resolved}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-base text-muted-foreground">
              {loading ? t("app.common.loading") : t("app.depts.empty")}
            </p>
          )}
        </section>
      ) : null}

      {isStaff ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <WorkloadChart
            rows={[
              ...(tracking?.departments ?? []).map((dept) => ({
                name: departmentName(dept),
                open: dept.open,
                overdue: dept.overdue,
                resolved: dept.resolved,
              })),
              ...(tracking?.unassigned
                ? [
                    {
                      name: t("app.depts.unassigned"),
                      open: tracking.unassigned.open,
                      overdue: tracking.unassigned.overdue,
                      resolved: tracking.unassigned.resolved,
                    },
                  ]
                : []),
            ]}
          />
          <MapPanel
            points={complaints
              .filter((row) => row.issue_lat !== null && row.issue_lng !== null)
              .map((row) => ({
                id: row.id,
                lat: row.issue_lat as number,
                lng: row.issue_lng as number,
                title: row.title,
                subtitle: `${row.tracking_code} · ${t(`app.statuses.${row.status}`)}`,
                band: row.priority_band,
              }))}
            height={360}
          />
        </div>
      ) : null}

      {isStaff ? (
        <section className="mt-8 rounded-sm border border-border bg-surface p-5 shadow-card">
          <h2 className="text-xl font-bold text-primary">{t("app.review.dupTitle")}</h2>
          <p className="mt-1 text-base text-muted-foreground">{t("app.review.dupIntro")}</p>

          {duplicates && duplicates.links.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {duplicates.links.map((link) => (
                <li key={link.id} className="rounded-sm border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      {link.complaint?.tracking_code} ↔ {link.related?.tracking_code}
                    </p>
                    <span className="rounded-sm bg-info-soft px-3 py-1 text-sm font-bold text-primary">
                      {t("app.review.dupMatch")}: {Math.round(Number(link.similarity))}/100
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-foreground">
                    {link.complaint?.title}
                  </p>
                  <p className="text-base text-muted-foreground">{link.related?.title}</p>
                  {link.reason ? (
                    <p className="mt-2 text-sm text-muted-foreground">{link.reason}</p>
                  ) : null}
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {link.state === "confirmed"
                      ? t("app.review.stateConfirmed")
                      : link.state === "rejected"
                        ? t("app.review.stateRejected")
                        : t("app.review.stateSuggested")}
                  </p>
                  {link.state === "suggested" && access?.canUpdate ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={savingId === link.id}
                        onClick={() => void handleDuplicate(link.id, "confirmed")}
                        className="inline-flex min-h-11 items-center rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-secondary disabled:opacity-60"
                      >
                        {t("app.review.confirm")}
                      </button>
                      <button
                        type="button"
                        disabled={savingId === link.id}
                        onClick={() => void handleDuplicate(link.id, "rejected")}
                        className="inline-flex min-h-11 items-center rounded-sm border border-border-strong px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                      >
                        {t("app.review.reject")}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-base text-muted-foreground">
              {loading ? t("app.common.loading") : t("app.review.dupEmpty")}
            </p>
          )}
        </section>
      ) : null}

      {isStaff ? (
        <section className="mt-8 rounded-sm border border-border bg-surface p-5 shadow-card">
          <h2 className="text-xl font-bold text-primary">{t("app.review.verifyTitle")}</h2>
          <p className="mt-1 text-base text-muted-foreground">{t("app.review.verifyIntro")}</p>

          {verification && verification.pending.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {verification.pending.map((item) => (
                <li key={item.id} className="rounded-sm border border-border p-4">
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.tracking_code} · {t(`app.categories.${item.category}`)}
                  </p>
                  <p className="mt-1 text-base font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.location_text}</p>
                  <button
                    type="button"
                    onClick={() => void loadEvidence(item.id)}
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-secondary underline"
                  >
                    <Images aria-hidden="true" className="size-4" />
                    {t("app.media.attached")}
                  </button>
                  {evidence[item.id] && evidence[item.id]!.length > 0 ? (
                    <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {evidence[item.id]!.map((photo) => (
                        <li key={photo.id}>
                          <img
                            src={photo.url}
                            alt=""
                            className="h-24 w-full rounded-sm border border-border object-cover"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {access?.canUpdate ? (
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <div className="min-w-56 flex-1">
                        <label
                          htmlFor={`verify-${item.id}`}
                          className="block text-sm font-semibold text-foreground"
                        >
                          {t("app.review.noteLabel")}
                        </label>
                        <input
                          id={`verify-${item.id}`}
                          value={verifyNotes[item.id] ?? ""}
                          onChange={(event) =>
                            setVerifyNotes((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                          className={`mt-1.5 w-full ${fieldClass}`}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => void handleVerification(item.id, "verified")}
                        className="inline-flex min-h-11 items-center rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-secondary disabled:opacity-60"
                      >
                        {t("app.review.verified")}
                      </button>
                      <button
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => void handleVerification(item.id, "rework")}
                        className="inline-flex min-h-11 items-center rounded-sm border border-border-strong px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                      >
                        {t("app.review.rework")}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-base text-muted-foreground">
              {loading ? t("app.common.loading") : t("app.review.verifyEmpty")}
            </p>
          )}

          {verification && verification.recent.length > 0 ? (
            <div className="mt-5 rounded-sm border border-border bg-muted/40 p-4">
              <p className="text-sm font-semibold text-foreground">{t("app.review.recent")}</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {verification.recent.slice(0, 6).map((entry, index) => (
                  <li key={index}>
                    {entry.decision === "verified"
                      ? t("app.review.verified")
                      : t("app.review.rework")}{" "}
                    · {formatDate(entry.created_at)}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
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

                <h2 className="mt-1 text-xl font-bold text-primary">
                  <Link
                    to="/complaints/$code"
                    params={{ code: complaint.tracking_code }}
                    className="underline-offset-2 hover:underline"
                  >
                    {complaint.title}
                  </Link>
                </h2>
                <Link
                  to="/complaints/$code"
                  params={{ code: complaint.tracking_code }}
                  className="mt-1 inline-block text-sm font-semibold text-secondary underline"
                >
                  {t("app.dashboard.openReport")}
                </Link>
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
                    {t("app.media.attached")}
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
