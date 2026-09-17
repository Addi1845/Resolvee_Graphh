import { Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";

import { useI18n } from "@/i18n";

export function StagePage({ titleKey, introKey }: { titleKey: string; introKey: string }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="inline-flex items-center gap-2 rounded-sm bg-warning-soft px-3 py-1.5 text-sm font-semibold text-warning-foreground ring-1 ring-warning/40">
        <Hammer aria-hidden="true" className="size-4" />
        {t("pages.stageNotice")}
      </p>
      <h1 className="mt-4 text-3xl font-bold text-primary sm:text-4xl">{t(titleKey)}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t(introKey)}</p>
      <Link
        to="/how-it-works"
        className="mt-8 inline-flex min-h-12 items-center rounded-sm bg-secondary px-5 text-base font-semibold text-secondary-foreground transition-colors hover:bg-primary"
      >
        {t("nav.howItWorks")}
      </Link>
    </div>
  );
}
