import { createFileRoute } from "@tanstack/react-router";

import { useI18n } from "@/i18n";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — ResolveGraph AI" },
      {
        name: "description",
        content:
          "From intake to verified closure: how ResolveGraph AI links related complaints, assigns department tasks and checks proof of completed work.",
      },
      { property: "og:title", content: "How It Works — ResolveGraph AI" },
      {
        property: "og:description",
        content: "What happens to your complaint after you submit it.",
      },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const { t, dict } = useI18n();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-primary sm:text-4xl">{t("pages.howItWorks.title")}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        {t("pages.howItWorks.intro")}
      </p>

      <ol className="mt-10 space-y-4">
        {dict.home.process.steps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-md border border-border bg-surface p-5 shadow-card"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary text-base font-bold text-primary-foreground">
              {index + 1}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
              <p className="mt-1 leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-12 text-2xl font-bold text-primary">{dict.home.methods.title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {dict.home.methods.items.map((item) => (
          <div key={item.title} className="rounded-md border border-border bg-surface p-5">
            <h3 className="font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-bold text-primary">{dict.home.tracking.title}</h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
        {dict.home.tracking.text}
      </p>
    </div>
  );
}
