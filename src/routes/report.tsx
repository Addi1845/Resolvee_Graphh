import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Send } from "lucide-react";

import { useI18n } from "@/i18n";
import { CATEGORIES, submitComplaint } from "@/lib/complaints.functions";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Complaint — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Report a civic problem with a description and location. You receive a tracking code to follow the action taken.",
      },
      { property: "og:title", content: "Report a Complaint — ResolveGraph AI" },
      {
        property: "og:description",
        content: "Submit a non-emergency grievance in English, Hindi or Marathi.",
      },
    ],
  }),
  component: ReportPage,
});

const fieldClass =
  "mt-1.5 block w-full rounded-sm border border-border-strong bg-surface px-3 py-3 text-base text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-ring";

function ReportPage() {
  const { t, locale } = useI18n();
  const submit = useServerFn(submitComplaint);

  const [category, setCategory] = useState<string>("water");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [landmark, setLandmark] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterContact, setReporterContact] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (title.trim().length < 4) return setError(t("app.report.errTitle"));
    if (description.trim().length < 15) return setError(t("app.report.errDesc"));
    if (locationText.trim().length < 3) return setError(t("app.report.errLocation"));

    setBusy(true);
    try {
      const result = await submit({
        data: {
          category,
          title,
          description,
          locationText,
          landmark,
          reporterName,
          reporterContact,
          language: locale,
        },
      });
      setCode(result.trackingCode);
    } catch {
      setError(t("app.report.errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  if (code) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="rounded-sm border border-success/40 bg-success-soft p-6">
          <p className="flex items-center gap-2 text-lg font-bold text-success-foreground">
            <CheckCircle2 aria-hidden="true" className="size-5" />
            {t("app.report.successTitle")}
          </p>
          <p className="mt-2 text-base text-foreground">{t("app.report.successText")}</p>
          <p className="mt-4 rounded-sm bg-surface px-4 py-3 text-2xl font-bold tracking-widest text-primary">
            {code}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/track"
            search={{ code }}
            className="inline-flex min-h-12 items-center rounded-sm bg-primary px-5 text-base font-semibold text-primary-foreground hover:bg-secondary"
          >
            {t("app.report.trackNow")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setCode(null);
              setTitle("");
              setDescription("");
              setLocationText("");
              setLandmark("");
            }}
            className="inline-flex min-h-12 items-center rounded-sm border border-border-strong px-5 text-base font-semibold text-foreground hover:bg-muted"
          >
            {t("app.report.another")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-primary sm:text-4xl">{t("app.report.title")}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{t("app.report.intro")}</p>

      <div className="mt-6 rounded-sm border border-warning/40 bg-warning-soft p-4 text-sm text-warning-foreground">
        {t("home.emergency.text")}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="category" className="text-sm font-semibold text-foreground">
            {t("app.report.category")}
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldClass}
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {t(`app.categories.${item}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="title" className="text-sm font-semibold text-foreground">
            {t("app.report.titleLabel")}
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("app.report.titlePlaceholder")}
            className={fieldClass}
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="text-sm font-semibold text-foreground">
            {t("app.report.descLabel")}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("app.report.descPlaceholder")}
            rows={6}
            className={fieldClass}
            required
          />
        </div>

        <div>
          <label htmlFor="location" className="text-sm font-semibold text-foreground">
            {t("app.report.locationLabel")}
          </label>
          <input
            id="location"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder={t("app.report.locationPlaceholder")}
            className={fieldClass}
            required
          />
        </div>

        <div>
          <label htmlFor="landmark" className="text-sm font-semibold text-foreground">
            {t("app.report.landmarkLabel")}{" "}
            <span className="font-normal text-muted-foreground">({t("app.common.optional")})</span>
          </label>
          <input
            id="landmark"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="text-sm font-semibold text-foreground">
              {t("app.report.nameLabel")}{" "}
              <span className="font-normal text-muted-foreground">
                ({t("app.common.optional")})
              </span>
            </label>
            <input
              id="name"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="contact" className="text-sm font-semibold text-foreground">
              {t("app.report.contactLabel")}{" "}
              <span className="font-normal text-muted-foreground">
                ({t("app.common.optional")})
              </span>
            </label>
            <input
              id="contact"
              value={reporterContact}
              onChange={(e) => setReporterContact(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t("app.report.contactHelp")}</p>

        {error ? (
          <p
            role="alert"
            className="rounded-sm border border-destructive/40 bg-destructive-soft px-4 py-3 text-sm font-semibold text-destructive-foreground"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-secondary disabled:opacity-60"
        >
          <Send aria-hidden="true" className="size-4" />
          {busy ? t("app.report.submitting") : t("app.report.submit")}
        </button>
      </form>
    </div>
  );
}
