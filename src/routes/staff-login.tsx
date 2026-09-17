import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";

import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { getMyAccess } from "@/lib/complaints.functions";
import { DemoAccountPicker } from "@/components/auth/DemoAccountPicker";
import { DEMO_STAFF_ACCOUNTS } from "@/lib/demo-accounts";

export const Route = createFileRoute("/staff-login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Official Login — ResolveGraph AI" },
      {
        name: "description",
        content:
          "Sign-in for intake officers, field officers, supervisors, administrators and auditors of ResolveGraph AI.",
      },
      { property: "og:title", content: "Official Login — ResolveGraph AI" },
      {
        property: "og:description",
        content: "Department staff sign-in for the ResolveGraph AI complaint queue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StaffLoginPage,
});

const fieldClass =
  "mt-1.5 block w-full rounded-sm border border-border-strong bg-surface px-3 py-3 text-base text-foreground outline-none focus:border-secondary focus:ring-2 focus:ring-ring";

function StaffLoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const access = useServerFn(getMyAccess);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoSelected, setDemoSelected] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await supabase.auth.signInWithPassword({ email, password });
      if (response.error || !response.data.session) {
        setError(response.error?.message ?? t("app.auth.error"));
        return;
      }
      // Official area: an account without a staff role is signed straight back out.
      const result = await access({ data: undefined });
      if (!result.isStaff) {
        await supabase.auth.signOut();
        setError(t("app.auth.staffOnly"));
        return;
      }
      await navigate({ to: "/dashboard", replace: true });
    } catch {
      setError(t("app.auth.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <span className="inline-flex items-center gap-2 rounded-sm bg-info-soft px-3 py-1 text-sm font-semibold text-primary">
        <ShieldCheck aria-hidden="true" className="size-4" />
        {t("app.auth.staffTitle")}
      </span>
      <h1 className="mt-3 text-3xl font-bold text-primary">{t("app.auth.staffTitle")}</h1>
      <p className="mt-3 text-base text-muted-foreground">{t("app.auth.staffIntro")}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            autoComplete="current-password"
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
          <ShieldCheck aria-hidden="true" className="size-4" />
          {busy ? t("app.auth.working") : t("app.auth.signIn")}
        </button>
      </form>

      <Link to="/auth" className="mt-6 inline-block text-sm font-semibold text-secondary underline">
        {t("app.auth.toCitizen")}
      </Link>

      <DemoAccountPicker
        accounts={DEMO_STAFF_ACCOUNTS}
        selected={demoSelected}
        onSelect={(demoEmail, demoPassword) => {
          setEmail(demoEmail);
          setPassword(demoPassword);
          setDemoSelected(demoEmail);
          setError(null);
        }}
      />
    </div>
  );
}
