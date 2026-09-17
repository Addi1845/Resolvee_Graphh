import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useI18n } from "@/i18n";

export type WorkloadRow = {
  name: string;
  open: number;
  overdue: number;
  resolved: number;
};

/**
 * Department resolution graph: how much work is still open, how much is past its
 * target date and how much is closed. Counts come straight from the complaints
 * table — no projections or estimates.
 */
export function WorkloadChart({ rows }: { rows: WorkloadRow[] }) {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const totals = rows.reduce(
    (acc, row) => ({
      open: acc.open + row.open,
      overdue: acc.overdue + row.overdue,
      resolved: acc.resolved + row.resolved,
    }),
    { open: 0, overdue: 0, resolved: 0 },
  );

  return (
    <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
      <h2 className="text-xl font-bold text-primary">{t("app.graph.workloadTitle")}</h2>
      <p className="mt-1 text-base text-muted-foreground">{t("app.graph.workloadIntro")}</p>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: t("app.depts.open"), value: totals.open },
          { label: t("app.depts.overdue"), value: totals.overdue },
          { label: t("app.depts.resolved"), value: totals.resolved },
        ].map((card) => (
          <div key={card.label} className="rounded-sm border border-border bg-muted/30 p-3">
            <dt className="text-sm font-semibold text-muted-foreground">{card.label}</dt>
            <dd className="mt-1 text-2xl font-bold text-primary">{card.value}</dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <p className="mt-4 text-base text-muted-foreground">{t("app.depts.empty")}</p>
      ) : ready ? (
        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-12} height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="open" name={t("app.depts.open")} fill="var(--color-secondary)" />
              <Bar dataKey="overdue" name={t("app.depts.overdue")} fill="var(--color-destructive)" />
              <Bar dataKey="resolved" name={t("app.depts.resolved")} fill="var(--color-success)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-base text-muted-foreground">{t("app.common.loading")}</p>
      )}
    </section>
  );
}
