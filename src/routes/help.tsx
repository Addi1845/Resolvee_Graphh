import { createFileRoute } from "@tanstack/react-router";

import { useI18n } from "@/i18n";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help, Accessibility and Privacy — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Answers to common questions about submitting and tracking complaints, plus accessibility and privacy information for the ResolveGraph AI portal.",
      },
      { property: "og:title", content: "Help, Accessibility and Privacy — ResolveGraph AI" },
      {
        property: "og:description",
        content: "Guidance on submitting, tracking and following up on a complaint.",
      },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  const { t, dict } = useI18n();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-primary sm:text-4xl">{t("pages.help.title")}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        {t("pages.help.intro")}
      </p>

      <h2 className="mt-10 text-2xl font-bold text-primary">{dict.home.faq.title}</h2>
      <dl className="mt-4 divide-y divide-border rounded-md border border-border bg-surface">
        {dict.home.faq.items.map((item) => (
          <div key={item.q} className="p-5">
            <dt className="font-semibold text-foreground">{item.q}</dt>
            <dd className="mt-1 leading-relaxed text-muted-foreground">{item.a}</dd>
          </div>
        ))}
      </dl>

      <h2 id="accessibility" className="mt-12 scroll-mt-24 text-2xl font-bold text-primary">
        {dict.home.trust.accessibility.title}
      </h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
        {dict.home.trust.accessibility.text}
      </p>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
        {t("a11y.keyboardHelpText")}
      </p>

      <h2 id="privacy" className="mt-12 scroll-mt-24 text-2xl font-bold text-primary">
        {dict.home.trust.privacy.title}
      </h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
        {dict.home.trust.privacy.text}
      </p>

      <h2 className="mt-12 text-2xl font-bold text-primary">{t("pages.help.contactTitle")}</h2>
      <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
        {t("pages.help.contactText")}
      </p>
    </div>
  );
}
