import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";

import { useI18n } from "@/i18n";
import { trackComplaint } from "@/lib/complaints.functions";

type TrackResult = Awaited<ReturnType<typeof trackComplaint>>;

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): { code?: string } =>
    typeof search['code'] === "string" && search['code'] ? { code: search['code'] } : {},
  head: () => ({
    meta: [
      { title: "Track a Complaint — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Use your tracking code to see the status, responsible department, target date and progress of your complaint.",
      },
      { property: "og:title", content: "Track a Complaint — ResolveGraph AI" },
      {
        property: "og:description",
        content: "Check the progress of a complaint using its tracking code.",
      },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const { t, formatDate, locale } = useI18n();
  const search = Route.useSearch();
  const lookup = useServerFn(trackComplaint);

  const [code, setCode] = useState(search.code ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);

  const runLookup = useCallback(
    async (value: string) => {
      if (!value.trim()) return;
      setBusy(true);
      try {
        setResult(await lookup({ data: { code: value } }));
      } finally {
        setBusy(false);
      }
    },
    [lookup],
  );

  useEffect(() => {
    if (search.code) void runLookup(search.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.code]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await runLookup(code);
  }


  const complaint = result?.found ? result.complaint : null;
  const department = complaint?.departments;
  const departmentName = department
    ? locale === "hi"
      ? department.name_hi
      : locale === "mr"
        ? department.name_mr
        : department.name_en
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-primary sm:text-4xl">{t("app.track.title")}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{t("app.track.intro")}</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <label htmlFor="code" className="text-sm font-semibold text-foreground">
            {t("app.track.codeLabel")}
          </label>
          <input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="RG-2026-ABC123"
            className="mt-1.5 block w-full rounded-sm border border-border-strong bg-surface px-3 py-3 text-base uppercase tracking-wider text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-secondary disabled:opacity-60"
        >
          <Search aria-hidden="true" className="size-4" />
          {busy ? t("app.track.searching") : t("app.track.search")}
        </button>
      </form>

      {result && !result.found ? (
        <p
          role="alert"
          className="mt-8 rounded-sm border border-warning/40 bg-warning-soft px-4 py-3 text-base font-semibold text-warning-foreground"
        >
          {t("app.track.notFound")}
        </p>
      ) : null}

      {complaint ? (
        <section className="mt-8 rounded-sm border border-border bg-surface p-6 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {complaint.tracking_code}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-primary">{complaint.title}</h2>
          <p className="mt-3 whitespace-pre-line text-base text-foreground">
            {complaint.description}
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">
                {t("app.track.status")}
              </dt>
              <dd className="mt-1 inline-flex rounded-sm bg-info-soft px-3 py-1 text-base font-bold text-primary">
                {t(`app.statuses.${complaint.status}`)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">
                {t("app.track.department")}
              </dt>
              <dd className="mt-1 text-base text-foreground">{departmentName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">
                {t("app.track.location")}
              </dt>
              <dd className="mt-1 text-base text-foreground">{complaint.location_text}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">{t("app.track.due")}</dt>
              <dd className="mt-1 text-base text-foreground">
                {complaint.due_date
                  ? formatDate(complaint.due_date, { dateStyle: "long", timeStyle: undefined })
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted-foreground">
                {t("app.track.filed")}
              </dt>
              <dd className="mt-1 text-base text-foreground">{formatDate(complaint.created_at)}</dd>
            </div>
          </dl>

          {result?.found && result.photos.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-primary">{t("app.media.attached")}</h3>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {result.photos.map((photo) => (
                  <li key={photo.id}>
                    <img
                      src={photo.url}
                      alt=""
                      className="h-32 w-full rounded-sm border border-border object-cover"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-6 rounded-sm border border-border bg-muted/40 p-4 text-sm">
            <p className="font-semibold text-foreground">{t("app.analysis.demoLabel")}</p>
            <p className="mt-1 text-muted-foreground">
              {t("app.analysis.priority")}:{" "}
              {complaint.priority_band
                ? `${t(`app.analysis.bands.${complaint.priority_band}`)} · ${complaint.priority_score ?? "—"}/100`
                : "—"}
            </p>
            <p className="mt-1 text-muted-foreground">{t("app.analysis.needsReview")}</p>
          </div>

          {complaint.resolution_note ? (
            <div className="mt-6 rounded-sm border border-success/40 bg-success-soft p-4">
              <p className="text-sm font-semibold text-success-foreground">
                {t("app.track.resolution")}
              </p>
              <p className="mt-1 text-base text-foreground">{complaint.resolution_note}</p>
            </div>
          ) : null}

          <h3 className="mt-8 text-lg font-bold text-primary">{t("app.track.timeline")}</h3>
          {result?.found && result.updates.length > 0 ? (
            <ol className="mt-3 space-y-3 border-l-2 border-border pl-4">
              {result.updates.map((update, index) => (
                <li key={index}>
                  <p className="text-base font-semibold text-foreground">
                    {t(`app.statuses.${update.status}`)}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatDate(update.created_at)}</p>
                  {update.note ? (
                    <p className="mt-1 text-base text-foreground">{update.note}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-base text-muted-foreground">{t("app.track.noUpdates")}</p>
          )}
        </section>
      ) : null}
    </div>
  );
}
