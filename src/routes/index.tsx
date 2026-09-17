import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileText,
  Languages,
  Lock,
  MapPin,
  Mic,
  Accessibility as AccessibilityIcon,
  Search,
} from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResolveGraph AI — Report, Track and Verify Civic Complaints" },
      {
        name: "description",
        content:
          "Report civic problems in English, Hindi or Marathi. ResolveGraph AI links related complaints, coordinates departments and verifies that the problem was resolved.",
      },
      { property: "og:title", content: "ResolveGraph AI — Report, Track and Verify" },
      {
        property: "og:description",
        content:
          "A citizen grievance portal that manages the real incident behind many complaints.",
      },
    ],
  }),
  component: Index,
});

const METHOD_ICONS = [FileText, Mic, Camera, MapPin];

function Index() {
  const { t, dict } = useI18n();

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:py-20">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold leading-tight text-primary sm:text-4xl lg:text-5xl">
              {dict.home.hero.title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground lg:text-xl">
              {dict.home.hero.text}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/report"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-sm bg-secondary px-6 text-base font-semibold text-secondary-foreground shadow-card transition-colors hover:bg-primary"
              >
                <FileText aria-hidden="true" className="size-5" />
                {dict.home.hero.report}
              </Link>
              <Link
                to="/track"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-sm border-2 border-primary px-6 text-base font-semibold text-primary transition-colors hover:bg-accent"
              >
                <Search aria-hidden="true" className="size-5" />
                {dict.home.hero.track}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency disclaimer */}
      <div className="border-b-2 border-destructive/30 bg-destructive-soft">
        <div className="mx-auto flex max-w-7xl gap-3 px-4 py-4">
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
          <p className="text-sm leading-relaxed text-foreground">
            <strong className="font-semibold">{dict.home.emergency.title}: </strong>
            {dict.home.emergency.text}
          </p>
        </div>
      </div>

      {/* Process */}
      <Reveal as="section" className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">{dict.home.process.title}</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {dict.home.process.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-md border border-border bg-surface p-5 shadow-card"
            >
              <span className="flex size-9 items-center justify-center rounded-sm bg-info-soft text-sm font-bold text-primary ring-1 ring-info/40">
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Categories */}
      <Reveal as="section" className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">
            {dict.home.categories.title}
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dict.home.categories.items.map((item) => (
              <li key={item.title} className="rounded-md border border-border bg-background p-5">
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Submission methods */}
      <Reveal as="section" className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">{dict.home.methods.title}</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dict.home.methods.items.map((item, index) => {
            const Icon = METHOD_ICONS[index] ?? FileText;
            return (
              <li
                key={item.title}
                className="rounded-md border border-border bg-surface p-5 shadow-card"
              >
                <Icon aria-hidden="true" className="size-6 text-secondary" />
                <h3 className="mt-3 font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Tracking + languages */}
      <Reveal as="section" className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-primary">
              <CheckCircle2 aria-hidden="true" className="size-6 text-success" />
              {dict.home.tracking.title}
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{dict.home.tracking.text}</p>
            <Link
              to="/track"
              className="mt-5 inline-flex min-h-12 items-center rounded-sm border-2 border-secondary px-5 text-base font-semibold text-secondary transition-colors hover:bg-accent"
            >
              {dict.home.tracking.cta}
            </Link>
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Languages aria-hidden="true" className="size-6 text-info" />
              {dict.home.languages.title}
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{dict.home.languages.text}</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <Reveal as="section" className="mx-auto max-w-4xl px-4 py-14">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">{dict.home.faq.title}</h2>
        <div className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
          {dict.home.faq.items.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-foreground marker:hidden">
                <span className="flex items-start justify-between gap-4">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-secondary group-open:rotate-45 transition-transform"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-2 leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Accessibility and privacy */}
      <Reveal as="section" className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-2xl font-bold text-primary sm:text-3xl">{dict.home.trust.title}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border bg-background p-5">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <AccessibilityIcon aria-hidden="true" className="size-5 text-secondary" />
                {dict.home.trust.accessibility.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {dict.home.trust.accessibility.text}
              </p>
            </div>
            <div className="rounded-md border border-border bg-background p-5">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <Lock aria-hidden="true" className="size-5 text-secondary" />
                {dict.home.trust.privacy.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {dict.home.trust.privacy.text}
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{t("footer.aboutText")}</p>
        </div>
      </section>
    </>
  );
}
