import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";

import { useI18n } from "@/i18n";
import {
  STATUSES,
  getMyAccess,
  listComplaints,
  updateComplaintStatus,
} from "@/lib/complaints.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Complaint Dashboard — ResolveGraph AI" },
      {
        name: "description",
        content: "Officer dashboard for reviewing and updating citizen complaints.",
      },
      { property: "og:title", content: "Complaint Dashboard — ResolveGraph AI" },
      { property: "og:description", content: "Officer workspace for ResolveGraph AI." },
    ],
  }),
  component: DashboardPage,
});

type Complaint = Awaited<ReturnType<typeof listComplaints>>["complaints"][number];

const fieldClass =
  "rounded-sm border border-border-strong bg-surface px-3 py-2.5 text-base text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-ring";

function DashboardPage() {
  const { t, formatDate } = useI18n();
  const fetchList = useServerFn(listComplaints);
  const fetchAccess = useServerFn(getMyAccess);
  const saveStatus = useServerFn(updateComplaintStatus);

  const [roles, setRoles] = useState<string[] | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchList({ data: { status, search } });
      setComplaints(result.complaints);
    } finally {
      setLoading(false);
    }
  }, [fetchList, status, search]);

  useEffect(() => {
    void fetchAccess({ data: undefined }).then((result) => setRoles(result.roles));
  }, [fetchAccess]);

  useEffect(() => {
    void load();
  }, [load]);

  const isStaff = roles?.some((role) => role !== "citizen") ?? false;

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
          {complaints.map((complaint) => (
            <li
              key={complaint.id}
              className="rounded-sm border border-border bg-surface p-5 shadow-card"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {complaint.tracking_code} · {t(`app.categories.${complaint.category}`)}
                </p>
                <span className="rounded-sm bg-info-soft px-3 py-1 text-sm font-bold text-primary">
                  {t(`app.statuses.${complaint.status}`)}
                </span>
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
          ))}
        </ul>
      )}
    </div>
  );
}
