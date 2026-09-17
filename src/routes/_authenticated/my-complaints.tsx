import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { useI18n } from "@/i18n";
import { listMyComplaints } from "@/lib/complaints.functions";

export const Route = createFileRoute("/_authenticated/my-complaints")({
  head: () => ({
    meta: [
      { title: "My Complaints — ResolveGraph AI" },
      {
        name: "description",
        content: "See the complaints you submitted while signed in and follow their progress.",
      },
      { property: "og:title", content: "My Complaints — ResolveGraph AI" },
      {
        property: "og:description",
        content: "Your submitted civic complaints and their current status.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyComplaintsPage,
});

type Row = Awaited<ReturnType<typeof listMyComplaints>>["complaints"][number];

function MyComplaintsPage() {
  const { t, formatDate } = useI18n();
  const fetchMine = useServerFn(listMyComplaints);
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    void fetchMine({ data: undefined }).then((result) => setRows(result.complaints));
  }, [fetchMine]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-primary">{t("app.mine.title")}</h1>
      <p className="mt-2 text-base text-muted-foreground">{t("app.mine.intro")}</p>

      {rows === null ? (
        <p className="mt-8 text-base text-muted-foreground">{t("app.common.loading")}</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-base text-muted-foreground">{t("app.mine.empty")}</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="rounded-sm border border-border bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {row.tracking_code} · {t(`app.categories.${row.category}`)}
                </p>
                <span className="rounded-sm bg-info-soft px-3 py-1 text-sm font-bold text-primary">
                  {t(`app.statuses.${row.status}`)}
                </span>
              </div>
              <h2 className="mt-1 text-lg font-bold text-primary">{row.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {row.location_text} · {formatDate(row.created_at)}
              </p>
              <Link
                to="/track"
                search={{ code: row.tracking_code }}
                className="mt-3 inline-flex min-h-11 items-center rounded-sm border border-border-strong px-4 text-sm font-semibold text-foreground hover:bg-muted"
              >
                {t("app.mine.view")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
