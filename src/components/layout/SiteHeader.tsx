import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, Menu, Network, X } from "lucide-react";

import { AccessibilityControls } from "./AccessibilityControls";
import { LanguageSelector } from "./LanguageSelector";
import { useI18n } from "@/i18n";

const NAV_ITEMS = [
  { to: "/", key: "nav.home" },
  { to: "/report", key: "nav.report" },
  { to: "/track", key: "nav.track" },
  { to: "/how-it-works", key: "nav.howItWorks" },
  { to: "/help", key: "nav.help" },
] as const;

export function SiteHeader() {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-primary-foreground">
      <div className="border-b border-primary-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs">
          <p className="rounded-sm bg-primary-foreground/10 px-2 py-1 font-medium">
            {t("brand.prototypeBadge")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSelector />
            <AccessibilityControls />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <Link to="/" className="flex items-center gap-3 rounded-sm">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-primary-foreground/12 ring-1 ring-primary-foreground/25">
            <Network aria-hidden="true" className="size-6" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight sm:text-xl">{t("brand.name")}</span>
            <span className="text-xs text-primary-foreground/80 sm:text-sm">
              {t("brand.subtitle")}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden min-h-11 items-center gap-2 rounded-sm border border-primary-foreground/40 px-4 text-sm font-semibold transition-colors hover:bg-primary-foreground/10 md:inline-flex"
          >
            <LogIn aria-hidden="true" className="size-4" />
            {t("nav.login")}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-sm border border-primary-foreground/40 px-3 text-sm font-semibold lg:hidden"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
            <span>{menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}</span>
          </button>
        </div>
      </div>

      <nav
        id="primary-navigation"
        aria-label={t("nav.mainNavigation")}
        className={`border-t border-primary-foreground/15 bg-primary ${menuOpen ? "block" : "hidden"} lg:block`}
      >
        <ul className="mx-auto flex max-w-7xl flex-col px-4 lg:flex-row lg:gap-1 lg:px-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={() => setMenuOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{
                  className:
                    "border-b-4 border-b-info bg-primary-foreground/10 text-primary-foreground",
                }}
                inactiveProps={{ className: "border-b-4 border-b-transparent" }}
                className="flex min-h-12 items-center px-3 text-sm font-semibold text-primary-foreground/90 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
          <li className="md:hidden">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-12 items-center gap-2 border-b-4 border-b-transparent px-3 text-sm font-semibold text-primary-foreground/90 hover:bg-primary-foreground/10"
            >
              <LogIn aria-hidden="true" className="size-4" />
              {t("nav.login")}
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
