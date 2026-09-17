import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogIn } from "lucide-react";

import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Citizen Login — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Citizens sign in to follow their ResolveGraph AI complaints. Reporting works without an account too.",
      },
      { property: "og:title", content: "Citizen Login — ResolveGraph AI" },
      { property: "og:description", content: "Citizen sign-in for ResolveGraph AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const fieldClass =
  "mt-1.5 block w-full rounded-sm border border-border-strong bg-surface px-3 py-3 text-base text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-ring";

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/my-complaints", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response =
        mode === "in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: window.location.origin,
                data: { full_name: fullName },
              },
            });
      if (response.error) {
        setError(response.error.message);
        return;
      }
      if (response.data.session) {
        await navigate({ to: "/my-complaints", replace: true });
      } else {
        setError(t("app.auth.error"));
      }
    } catch {
      setError(t("app.auth.error"));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(t("app.auth.error"));
      return;
    }
    if (result.redirected) return;
    await navigate({ to: "/my-complaints", replace: true });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-bold text-primary">{t("app.auth.title")}</h1>
      <p className="mt-3 text-base text-muted-foreground">{t("app.auth.intro")}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {mode === "up" ? (
          <div>
            <label htmlFor="fullName" className="text-sm font-semibold text-foreground">
              {t("app.auth.name")}
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={fieldClass}
            />
          </div>
        ) : null}
        <div>
          <label htmlFor="email" className="text-sm font-semibold text-foreground">
            {t("app.auth.email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-semibold text-foreground">
            {t("app.auth.password")}
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            required
          />
        </div>

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
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-secondary disabled:opacity-60"
        >
          <LogIn aria-hidden="true" className="size-4" />
          {busy ? t("app.auth.working") : mode === "in" ? t("app.auth.signIn") : t("app.auth.signUp")}
        </button>
      </form>

      <button
        type="button"
        onClick={handleGoogle}
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-sm border border-border-strong bg-surface px-6 text-base font-semibold text-foreground hover:bg-muted"
      >
        {t("app.auth.google")}
      </button>

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setMode((m) => (m === "in" ? "up" : "in"))}
          className="self-start text-sm font-semibold text-secondary underline"
        >
          {mode === "in" ? t("app.auth.switchToSignUp") : t("app.auth.switchToSignIn")}
        </button>
        <Link to="/staff-login" className="self-start text-sm font-semibold text-secondary underline">
          {t("app.auth.toStaff")}
        </Link>
      </div>
    </div>
  );
}
