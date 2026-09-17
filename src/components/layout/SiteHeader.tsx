import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";

import logoUrl from "@/assets/resolvegraph-logo.png";

import { AccessibilityControls } from "./AccessibilityControls";
import { LanguageSelector } from "./LanguageSelector";
import { useI18n } from "@/i18n";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccess } from "@/lib/complaints.functions";

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
  const { session } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isStaff, setIsStaff] = useState(false);

  // Only officials get the official dashboard link.
  useEffect(() => {
    if (!session) {
      setIsStaff(false);
      return;
    }
    let active = true;
    void getMyAccess({ data: undefined })
      .then((result) => active && setIsStaff(result.isStaff))
      .catch(() => active && setIsStaff(false));
    return () => {
      active = false;
    };
  }, [session]);

  async function handleSignOut() {
    setMenuOpen(false);
    setIsStaff(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/", replace: true });
  }


  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 rounded-sm">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-foreground">
            <img
              src={logoUrl}
              alt=""
              aria-hidden="true"
              width={1024}
              height={1024}
              className="size-8 object-contain"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-base font-bold tracking-tight sm:text-lg">{t("brand.name")}</span>
            <span className="hidden truncate text-xs text-primary-foreground/80 sm:block">
              {t("brand.subtitle")}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 border-e border-primary-foreground/20 pe-2.5 me-1 sm:flex">
            <LanguageSelector />
            <AccessibilityControls />
          </div>
          {session ? (
            <>
              <Link
                to="/my-complaints"
                className="hidden min-h-11 items-center gap-2 rounded-sm border border-primary-foreground/40 px-4 text-sm font-semibold transition-colors hover:bg-primary-foreground/10 md:inline-flex"
              >
                {t("app.auth.myDashboard")}
              </Link>
              {isStaff ? (
              <Link
                to="/dashboard"
                className="hidden min-h-11 items-center gap-2 rounded-sm border border-primary-foreground/40 px-4 text-sm font-semibold transition-colors hover:bg-primary-foreground/10 md:inline-flex"
              >
                <LayoutDashboard aria-hidden="true" className="size-4" />
                {t("app.auth.staffDashboard")}
              </Link>
              ) : null}
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="hidden min-h-11 items-center gap-2 rounded-sm border border-primary-foreground/40 px-4 text-sm font-semibold transition-colors hover:bg-primary-foreground/10 md:inline-flex"
              >
                <LogOut aria-hidden="true" className="size-4" />
                {t("app.auth.signOut")}
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="hidden min-h-11 items-center gap-2 rounded-sm border border-primary-foreground/40 px-4 text-sm font-semibold transition-colors hover:bg-primary-foreground/10 md:inline-flex"
            >
              <LogIn aria-hidden="true" className="size-4" />
              {t("nav.login")}
            </Link>
          )}
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
            <span className="hidden sm:inline">{menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}</span>
            <span className="sr-only sm:hidden">{menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}</span>
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
          <li className="border-t border-primary-foreground/15 px-3 py-2 sm:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <LanguageSelector />
              <AccessibilityControls />
            </div>
          </li>
          <li className="md:hidden">
            {session ? (
              <div className="flex flex-col">
                <Link
                  to="/my-complaints"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center gap-2 border-b-4 border-b-transparent px-3 text-sm font-semibold text-primary-foreground/90 hover:bg-primary-foreground/10"
                >
                  {t("app.auth.myDashboard")}
                </Link>
                {isStaff ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center gap-2 border-b-4 border-b-transparent px-3 text-sm font-semibold text-primary-foreground/90 hover:bg-primary-foreground/10"
                >
                  <LayoutDashboard aria-hidden="true" className="size-4" />
                  {t("app.auth.staffDashboard")}
                </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="flex min-h-12 items-center gap-2 px-3 text-left text-sm font-semibold text-primary-foreground/90 hover:bg-primary-foreground/10"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  {t("app.auth.signOut")}
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center gap-2 border-b-4 border-b-transparent px-3 text-sm font-semibold text-primary-foreground/90 hover:bg-primary-foreground/10"
              >
                <LogIn aria-hidden="true" className="size-4" />
                {t("nav.login")}
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
