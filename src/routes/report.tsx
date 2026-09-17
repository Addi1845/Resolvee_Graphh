import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, ChevronLeft, ChevronRight, Send } from "lucide-react";

import { useI18n } from "@/i18n";
import { LocationStep, type LocationDraft } from "@/components/report/LocationStep";
import { PhotoPicker, type DraftPhoto } from "@/components/report/PhotoPicker";
import { VoiceInput } from "@/components/report/VoiceInput";
import { VoiceInput } from "@/components/report/VoiceInput";
import { submitComplaint } from "@/lib/complaints.functions";
import { MEDIA_POLICY } from "@/lib/policy";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Complaint — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Report a civic problem in four short steps: describe it, mark the location, add photos and review. You receive a tracking code.",
      },
      { property: "og:title", content: "Report a Complaint — ResolveGraph AI" },
      {
        property: "og:description",
        content: "Submit a non-emergency grievance in English, Hindi or Marathi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

const fieldClass =
  "mt-1.5 block w-full rounded-sm border border-border-strong bg-surface px-3 py-3 text-base text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-ring";

const STEPS = ["describe", "locate", "attach", "review"] as const;
type Step = (typeof STEPS)[number];

const DRAFT_KEY = "resolvegraph.report.draft";

type Draft = {
  title: string;
  description: string;
  reporterName: string;
  reporterContact: string;
  location: LocationDraft;
};

const emptyDraft: Draft = {
  title: "",
  description: "",
  reporterName: "",
  reporterContact: "",
  location: { locationText: "", landmark: "", issue: null, device: null },
};

function ReportPage() {
  const { t, locale } = useI18n();
  const submit = useServerFn(submitComplaint);

  const [step, setStep] = useState<Step>("describe");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    code: string;
    photos: number;
    category: string;
    method: string;
    needsReview: boolean;
    departments: { code: string; role: string }[];
  } | null>(null);

  // Restore the saved draft before the fields become editable, so a restore
  // never overwrites something the person has already started typing.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(DRAFT_KEY);
      if (stored) setDraft({ ...emptyDraft, ...(JSON.parse(stored) as Draft) });
    } catch {
      /* ignore unreadable drafts */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage may be unavailable */
    }
  }, [draft, ready]);

  function validateStep(current: Step): string | null {
    if (current === "describe") {
      if (draft.title.trim().length < 4) return t("app.report.errTitle");
      if (draft.description.trim().length < 15) return t("app.report.errDesc");
    }
    if (current === "locate" && draft.location.locationText.trim().length < 3) {
      return t("app.report.errLocation");
    }
    // Photo evidence is mandatory for every complaint; video is optional.
    if (current === "attach" && photos.every((item) => item.kind === "video")) {
      return t("app.media.required");
    }
    return null;
  }

  function goNext() {
    const problem = validateStep(step);
    if (problem) return setError(problem);
    setError(null);
    setStep(STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]!);
  }

  function goBack() {
    setError(null);
    setStep(STEPS[Math.max(STEPS.indexOf(step) - 1, 0)]!);
  }

  async function handleSubmit() {
    for (const current of STEPS) {
      const problem = validateStep(current);
      if (problem) {
        setStep(current);
        return setError(problem);
      }
    }
    setBusy(true);
    setError(null);
    try {
      const response = await submit({
        data: {
          title: draft.title,
          description: draft.description,
          language: locale,
          locationText: draft.location.locationText,
          landmark: draft.location.landmark,
          reporterName: draft.reporterName,
          reporterContact: draft.reporterContact,
          issueLat: draft.location.issue?.lat ?? null,
          issueLng: draft.location.issue?.lng ?? null,
          device: draft.location.device,
          photos: photos.map((photo) => ({
            dataUrl: photo.dataUrl,
            mime: photo.mime,
            kind: photo.kind,
            source: photo.source,
          })),
        },
      });
      setResult({
        code: response.trackingCode,
        photos: response.photosStored,
        category: response.detectedCategory,
        method: response.analysisMethod,
        needsReview: response.needsReview,
        departments: response.departments,
      });
      window.localStorage.removeItem(DRAFT_KEY);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      setError(message.includes("PHOTO_REQUIRED") ? t("app.media.required") : t("app.report.errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 text-base text-muted-foreground">
        {t("app.common.loading")}
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="rounded-sm border border-success/40 bg-success-soft p-6">
          <p className="flex items-center gap-2 text-lg font-bold text-success-foreground">
            <CheckCircle2 aria-hidden="true" className="size-5" />
            {t("app.report.successTitle")}
          </p>
          <p className="mt-2 text-base text-foreground">{t("app.report.successText")}</p>
          <p className="mt-4 rounded-sm bg-surface px-4 py-3 text-2xl font-bold tracking-widest text-primary">
            {result.code}
          </p>
        </div>

        <section className="mt-6 rounded-sm border border-border bg-surface p-5">
          <h2 className="text-lg font-bold text-primary">{t("app.triage.resultTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.method === "ai_vision"
              ? t("app.triage.methodAi")
              : t("app.triage.methodRule")}
          </p>
          <p className="mt-3 text-base text-foreground">
            <span className="font-semibold">{t("app.triage.detected")}: </span>
            {t(`app.categories.${result.category}`)}
          </p>
          <p className="mt-3 text-sm font-semibold text-foreground">
            {t("app.triage.departments")}
          </p>
          <ul className="mt-2 space-y-2">
            {result.departments.map((dept) => (
              <li
                key={dept.code}
                className="flex flex-wrap items-center gap-2 rounded-sm border border-border px-3 py-2 text-base text-foreground"
              >
                {t(`app.categories.${dept.code}`)}
                <span
                  className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${
                    dept.role === "primary"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {dept.role === "primary"
                    ? t("app.triage.rolePrimary")
                    : t("app.triage.roleSupporting")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">{t("app.triage.reviewNote")}</p>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/track"
            search={{ code: result.code }}
            className="inline-flex min-h-12 items-center rounded-sm bg-primary px-5 text-base font-semibold text-primary-foreground hover:bg-secondary"
          >
            {t("app.report.trackNow")}
          </Link>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setDraft(emptyDraft);
              setPhotos([]);
              setStep("describe");
            }}
            className="inline-flex min-h-12 items-center rounded-sm border border-border-strong px-5 text-base font-semibold text-foreground hover:bg-muted"
          >
            {t("app.report.another")}
          </button>
        </div>
      </div>
    );
  }

  const index = STEPS.indexOf(step);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-primary sm:text-4xl">{t("app.report.title")}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{t("app.report.intro")}</p>

      <div className="mt-6 rounded-sm border border-warning/40 bg-warning-soft p-4 text-sm text-warning-foreground">
        {t("home.emergency.text")}
      </div>

      <ol className="mt-8 flex flex-wrap gap-2" aria-label={t("app.wizard.review")}>
        {STEPS.map((item, position) => {
          const state =
            position === index ? "current" : position < index ? "done" : "upcoming";
          return (
            <li key={item} className="flex-1">
              <div
                aria-current={state === "current" ? "step" : undefined}
                className={`rounded-sm border px-3 py-2 text-sm font-semibold ${
                  state === "current"
                    ? "border-primary bg-primary text-primary-foreground"
                    : state === "done"
                      ? "border-success/50 bg-success-soft text-success-foreground"
                      : "border-border bg-surface text-muted-foreground"
                }`}
              >
                <span className="block text-xs font-normal opacity-80">{position + 1}</span>
                {t(`app.wizard.${item}`)}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("app.wizard.stepOf", { n: index + 1, total: STEPS.length })} · {t("app.wizard.draftSaved")}
      </p>

      <div className="mt-8 space-y-5">
        {step === "describe" ? (
          <>
            <div className="rounded-sm border border-info/40 bg-info-soft p-4 text-sm text-foreground">
              {t("app.triage.autoRoute")}
            </div>
            <div>
              <label htmlFor="title" className="text-sm font-semibold text-foreground">
                {t("app.report.titleLabel")}
              </label>
              <input
                id="title"
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder={t("app.report.titlePlaceholder")}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="description" className="text-sm font-semibold text-foreground">
                {t("app.report.descLabel")}
              </label>
              <textarea
                id="description"
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                placeholder={t("app.report.descPlaceholder")}
                rows={6}
                className={fieldClass}
              />
              <VoiceInput
                onText={(text) =>
                  setDraft((current) => ({
                    ...current,
                    description: current.description.trim()
                      ? `${current.description.trim()}\n${text}`
                      : text,
                  }))
                }
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
                  value={draft.reporterName}
                  onChange={(event) => setDraft({ ...draft, reporterName: event.target.value })}
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
                  value={draft.reporterContact}
                  onChange={(event) => setDraft({ ...draft, reporterContact: event.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{t("app.report.contactHelp")}</p>
          </>
        ) : null}

        {step === "locate" ? (
          <>
            <h2 className="text-xl font-bold text-primary">{t("app.location.title")}</h2>
            <p className="text-muted-foreground">{t("app.location.intro")}</p>
            <LocationStep
              value={draft.location}
              onChange={(location) => setDraft({ ...draft, location })}
            />
          </>
        ) : null}

        {step === "attach" ? (
          <>
            <h2 className="text-xl font-bold text-primary">{t("app.media.title")}</h2>
            <p className="text-muted-foreground">
              {t("app.media.intro", {
                n: MEDIA_POLICY.maxPhotos,
                mb: MEDIA_POLICY.maxPhotoBytes / (1024 * 1024),
              })}
            </p>
            <PhotoPicker photos={photos} onChange={setPhotos} />
            <p className="text-sm text-muted-foreground">{t("app.media.privacy")}</p>
          </>
        ) : null}

        {step === "review" ? (
          <>
            <h2 className="text-xl font-bold text-primary">{t("app.wizard.review")}</h2>
            <p className="text-muted-foreground">{t("app.wizard.reviewIntro")}</p>
            <dl className="divide-y divide-border rounded-sm border border-border bg-surface">
              {[
                { label: t("app.report.category"), value: t("app.triage.pending") },
                { label: t("app.report.titleLabel"), value: draft.title },
                { label: t("app.report.descLabel"), value: draft.description },
                { label: t("app.report.locationLabel"), value: draft.location.locationText },
                {
                  label: t("app.report.landmarkLabel"),
                  value: draft.location.landmark || t("app.wizard.notProvided"),
                },
                {
                  label: t("app.location.captured"),
                  value: draft.location.device
                    ? t("app.location.accuracy", {
                        m: Math.round(draft.location.device.accuracyM),
                      })
                    : t("app.location.states.unavailable"),
                },
                {
                  label: t("app.media.title"),
                  value:
                    photos.length > 0 ? String(photos.length) : t("app.wizard.noPhotos"),
                },
                {
                  label: t("app.report.contactLabel"),
                  value: draft.reporterContact || t("app.wizard.notProvided"),
                },
              ].map((row) => (
                <div key={row.label} className="grid gap-1 px-4 py-3 sm:grid-cols-3">
                  <dt className="text-sm font-semibold text-muted-foreground">{row.label}</dt>
                  <dd className="text-base text-foreground sm:col-span-2">{row.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="rounded-sm border border-destructive/40 bg-destructive-soft px-4 py-3 text-sm font-semibold text-destructive-foreground"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {index > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-border-strong px-5 text-base font-semibold text-foreground hover:bg-muted"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              {t("app.wizard.back")}
            </button>
          ) : null}

          {step === "review" ? (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={busy}
              className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-secondary disabled:opacity-60"
            >
              <Send aria-hidden="true" className="size-4" />
              {busy ? t("app.triage.analysing") : t("app.report.submit")}
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex min-h-12 items-center gap-2 rounded-sm bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-secondary"
            >
              {t("app.wizard.next")}
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
