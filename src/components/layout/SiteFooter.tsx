import { Link } from "@tanstack/react-router";

import { useI18n } from "@/i18n";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-16 border-t-4 border-t-primary bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h2 className="text-base font-bold text-primary">{t("footer.aboutTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {t("footer.aboutText")}
          </p>
        </div>
        <div>
          <h2 className="text-base font-bold text-primary">{t("footer.servicesTitle")}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link to="/report" className="inline-flex min-h-9 items-center text-secondary hover:underline">
                {t("nav.report")}
              </Link>
            </li>
            <li>
              <Link to="/track" className="inline-flex min-h-9 items-center text-secondary hover:underline">
                {t("nav.track")}
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="inline-flex min-h-9 items-center text-secondary hover:underline">
                {t("nav.howItWorks")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-base font-bold text-primary">{t("footer.infoTitle")}</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link
                to="/help"
                hash="accessibility"
                className="inline-flex min-h-9 items-center text-secondary hover:underline"
              >
                {t("footer.accessibility")}
              </Link>
            </li>
            <li>
              <Link
                to="/help"
                hash="privacy"
                className="inline-flex min-h-9 items-center text-secondary hover:underline"
              >
                {t("footer.privacy")}
              </Link>
            </li>
            <li>
              <Link to="/help" className="inline-flex min-h-9 items-center text-secondary hover:underline">
                {t("nav.help")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground">
          {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}
