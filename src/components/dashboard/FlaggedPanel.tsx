import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, ShieldAlert } from "lucide-react";

import { useI18n } from "@/i18n";
import { clearIntegrityFlag, listFlaggedComplaints } from "@/lib/complaints.functions";

type Row = {
  id: string;
  tracking_code: string;
  title: string;
  category: string;
  status: string;
  location_text: string;
  created_at: string;
  integrity_reasons: unknown;
  integrity_acknowledged: boolean;
};

/** Department queues for possibly-not-genuine and possible-duplicate reports. */
export function FlaggedPanel({ canClear }: { canClear: boolean }) {
  const { t } = useI18n();
  const list = useServerFn(listFlaggedComplaints);
  const clear = useServerFn(clearIntegrityFlag);
  const [fake, setFake] = useState<Row[]>([]);
  const [dups, setDups] = useState<Row[]>([]);
  const [tab, setTab] = useState<"fake" | "dup">("fake");
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await list();
      setFake(data.fake as Row[]);
      setDups(data.duplicates as Row[]);
    } catch {
      /* keep empty */
    }
  }, [list]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleClear(id: string) {
    setSaving(id);
    try {
      await clear({ data: { id } });
      await load();
    } finally {
      setSaving(null);
    }
  }

  const rows = tab === "fake" ? fake : dups;

  return (
    <section className="rounded-sm border border-border bg-surface p-5 shadow-card">
      <h2 className="text-xl font-bold text-primary">{t("app.flagged.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("app.flagged.intro")}</p>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist">
        {(
          [
            { key: "fake", label: t("app.flagged.fakeTitle"), count: fake.length, Icon: ShieldAlert },
            { key: "dup", label: t("app.flagged.dupTitle"), count: dups.length, Icon: Copy },
          ] as const
        ).map(({ key, label, count, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`inline-flex min-h-10 items-center gap-2 rounded-sm border px-4 text-sm font-semibold ${
              tab === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border-strong text-foreground hover:bg-muted"
            }`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
            <span className="rounded-sm bg-surface/80 px-1.5 text-xs text-foreground">{count}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {tab === "fake" ? t("app.flagged.fakeEmpty") : t("app.flagged.dupEmpty")}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const reasons = Array.isArray(row.integrity_reasons)
              ? (row.integrity_reasons as string[])
              : [];
            return (
              <li key={row.id} className="rounded-sm border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-base font-semibold text-foreground">
                    <span className="text-primary">{row.tracking_code}</span> · {row.title}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {t(`app.categories.${row.category}`)} · {row.location_text}
                  </span>
                </div>
                {tab === "fake" && reasons.length > 0 ? (
                  <div className="mt-2 text-sm">
                    <p className="font-semibold text-warning-foreground">{t("app.flagged.reasons")}</p>
                    <ul className="list-disc pl-5 text-foreground">
                      {reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {tab === "fake" && row.integrity_acknowledged ? (
                  <p className="mt-2 text-xs text-muted-foreground">{t("app.flagged.acknowledged")}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to="/complaints/$code"
                    params={{ code: row.tracking_code }}
                    className="inline-flex min-h-10 items-center rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-secondary"
                  >
                    {t("app.flagged.open")}
                  </Link>
                  {tab === "fake" && canClear ? (
                    <button
                      type="button"
                      disabled={saving === row.id}
                      onClick={() => void handleClear(row.id)}
                      className="inline-flex min-h-10 items-center rounded-sm border border-border-strong px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                    >
                      {t("app.flagged.clear")}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
