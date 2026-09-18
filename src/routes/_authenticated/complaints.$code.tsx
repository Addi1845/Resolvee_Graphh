import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Copy, Printer } from "lucide-react";

import { useI18n } from "@/i18n";
import { ComplaintLocation } from "@/components/complaint/ComplaintLocation";
import { ResolutionGraph } from "@/components/complaint/ResolutionGraph";
import { getComplaintDetail, getMyAccess, updateComplaintStatus } from "@/lib/complaints.functions";

export const Route = createFileRoute("/_authenticated/complaints/$code")({
  head: () => ({
    meta: [
      { title: "Complaint Report — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Full officer report for one complaint: responsible departments, evidence, resolution graph and review history.",
      },
      { property: "og:title", content: "Complaint Report — ResolveGraph AI" },
      {
        property: "og:description",
        content: "Departments, evidence, resolution stages and review history for a single complaint.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ComplaintReportPage,
});

type Detail = Awaited<ReturnType<typeof getComplaintDetail>>;
type DeptRow = { code: string; name_en: string; name_hi: string; name_mr: string } | null;

function ComplaintReportPage() {
  const { code } = Route.useParams();
  const { t, locale, formatDate } = useI18n();
  const fetchDetail = useServerFn(getComplaintDetail);

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchDetail({ data: { code } }));
    } catch {
      setData({ found: false } as Detail);
    } finally {
      setLoading(false);
    }
  }, [code, fetchDetail]);

  useEffect(() => {
    void load();
  }, [load]);

  function departmentName(dept: DeptRow) {
    if (!dept) return "—";
    return locale === "hi" ? dept.name_hi : locale === "mr" ? dept.name_mr : dept.name_en;
  }

  if (loading) {
    return <p className="py-16 text-center text-base text-muted-foreground">{t("app.common.loading")}</p>;
  }

  if (!data?.found) {
    return (
      <div className="py-16 text-center">
        <p className="text-base text-foreground">{t("app.reportView.notFound")}</p>
        <Link to="/dashboard" className="mt-4 inline-block text-base font-semibold text-secondary underline">
          {t("app.dashboard.backToQueue")}
        </Link>
      </div>
    );
  }

  const { complaint, updates, routedDepartments, duplicates, verifications, photos } = data;
  const reached = updates.map((entry) => entry.status);
  const mapPoints =
    complaint.issue_lat !== null && complaint.issue_lng !== null
      ? [
          {
            id: complaint.id,
            lat: complaint.issue_lat,
            lng: complaint.issue_lng,
            title: complaint.title,
            subtitle: complaint.location_text,
            band: complaint.priority_band,
          },
        ]
      : [];

  return (
    <div className="mx-auto max-w-5xl py-8">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-secondary underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t("app.dashboard.backToQueue")}
      </Link>

      <header className="mt-4 rounded-sm border border-border bg-surface p-5 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {complaint.tracking_code} · {t(`app.categories.${complaint.category}`)}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-primary">{complaint.title}</h1>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-sm bg-info-soft px-3 py-1 text-sm font-bold text-primary">
            {t(`app.statuses.${complaint.status}`)}
          </span>
          {complaint.priority_band ? (
            <span className="rounded-sm border border-border-strong px-3 py-1 text-sm font-bold text-foreground">
              {t(`app.analysis.bands.${complaint.priority_band}`)} · {complaint.priority_score ?? "—"}/100
            </span>
          ) : null}
          <span className="rounded-sm border border-border px-3 py-1 text-sm font-semibold text-muted-foreground">
            {formatDate(complaint.created_at)}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm bg-primary px-4 text-base font-semibold text-primary-foreground"
          >
            <Printer aria-hidden="true" className="size-4" />
            {t("app.reportView.print")}
          </button>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard?.writeText(complaint.tracking_code);
              setCopied(true);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-sm border border-border-strong px-4 text-base font-semibold text-foreground"
          >
            <Copy aria-hidden="true" className="size-4" />
            {t("app.reportView.copy")}
          </button>
        </div>
        {copied ? (
          <p className="mt-2 text-sm font-semibold text-success-foreground">
            {t("app.reportView.copied")}
          </p>
        ) : null}
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-6">
          <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
            <h2 className="text-xl font-bold text-primary">{t("app.reportView.details")}</h2>
            <p className="mt-2 whitespace-pre-line text-base text-foreground">{complaint.description}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: t("app.track.location"), value: complaint.location_text },
                { label: t("app.track.due"), value: complaint.due_date ?? "—" },
                {
                  label: t("app.reportView.reporter"),
                  value: complaint.reporter_name || t("app.reportView.notShared"),
                },
                {
                  label: t("app.reportView.contact"),
                  value: complaint.reporter_contact || t("app.reportView.notShared"),
                },
              ].map((item) => (
                <div key={item.label} className="rounded-sm border border-border bg-muted/30 p-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{item.label}</dt>
                  <dd className="mt-1 text-base font-semibold text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <ResolutionGraph status={complaint.status} reachedStatuses={reached} />

          <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
            <h2 className="text-xl font-bold text-primary">{t("app.triage.departments")}</h2>
            <ul className="mt-3 grid gap-2">
              {routedDepartments.map((row, index) => (
                <li
                  key={`${row.role}-${index}`}
                  className="rounded-sm border border-border bg-muted/30 p-3"
                >
                  <p className="text-base font-semibold text-foreground">
                    {departmentName(row.departments as DeptRow)} ·{" "}
                    <span className="text-secondary">
                      {row.role === "primary" ? t("app.triage.rolePrimary") : t("app.triage.roleSupporting")}
                    </span>
                  </p>
                  {row.reason ? (
                    <p className="mt-1 text-sm text-muted-foreground">{row.reason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-muted-foreground">{t("app.triage.reviewNote")}</p>
          </section>

          {photos.length > 0 ? (
            <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
              <h2 className="text-xl font-bold text-primary">{t("app.reportView.evidence")}</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {photos.map((photo: { url: string; kind?: string }, index: number) => (
                  <li key={photo.url} className="overflow-hidden rounded-sm border border-border">
                    {photo.kind === "video" ? (
                      <video src={photo.url} controls className="h-48 w-full bg-black object-contain" />
                    ) : (
                      <img
                        src={photo.url}
                        alt={`${t("app.reportView.evidence")} ${index + 1}`}
                        className="h-48 w-full object-cover"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="grid gap-6">
          <ComplaintLocation
            lat={complaint.issue_lat}
            lng={complaint.issue_lng}
            title={complaint.title}
            subtitle={`${complaint.tracking_code} · ${t(`app.statuses.${complaint.status}`)}`}
            band={complaint.priority_band}
            locationText={complaint.location_text}
            height={260}
          />

          <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
            <h2 className="text-xl font-bold text-primary">{t("app.reportView.analysis")}</h2>
            <p className="mt-2 text-base text-foreground">
              {complaint.analysis_method === "ai_vision"
                ? t("app.triage.methodAi")
                : t("app.triage.methodRule")}
            </p>
          </section>

          <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
            <h2 className="text-xl font-bold text-primary">{t("app.reportView.duplicates")}</h2>
            {duplicates.length === 0 ? (
              <p className="mt-2 text-base text-muted-foreground">
                {t("app.reportView.duplicatesEmpty")}
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {duplicates.map((link) => (
                  <li key={link.id} className="rounded-sm border border-border bg-muted/30 p-3 text-sm">
                    <p className="font-semibold text-foreground">
                      {(link.related as { tracking_code?: string } | null)?.tracking_code} ·{" "}
                      {Math.round(Number(link.similarity))}%
                    </p>
                    <p className="mt-1 text-muted-foreground">{link.reason ?? link.state}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
            <h2 className="text-xl font-bold text-primary">{t("app.reportView.verifications")}</h2>
            {verifications.length === 0 ? (
              <p className="mt-2 text-base text-muted-foreground">
                {t("app.reportView.verificationsEmpty")}
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {verifications.map((entry, index) => (
                  <li
                    key={`${entry.created_at}-${index}`}
                    className="rounded-sm border border-border bg-muted/30 p-3 text-sm"
                  >
                    <p className="font-semibold text-foreground">
                      {entry.decision} · {formatDate(entry.created_at)}
                    </p>
                    {entry.note ? <p className="mt-1 text-muted-foreground">{entry.note}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
            <h2 className="text-xl font-bold text-primary">{t("app.track.timeline")}</h2>
            <ol className="mt-3 grid gap-3">
              {updates.map((entry, index) => (
                <li key={`${entry.created_at}-${index}`} className="border-l-2 border-secondary pl-3">
                  <p className="text-base font-semibold text-foreground">
                    {t(`app.statuses.${entry.status}`)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(entry.created_at)}
                    {entry.actor_name ? ` · ${entry.actor_name}` : ""}
                  </p>
                  {entry.note ? <p className="mt-1 text-sm text-foreground">{entry.note}</p> : null}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
